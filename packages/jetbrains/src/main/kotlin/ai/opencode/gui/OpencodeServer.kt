package ai.opencode.gui

import com.intellij.openapi.diagnostic.logger
import java.io.BufferedReader
import java.io.InputStreamReader
import java.util.concurrent.CompletableFuture
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

private val LOG = logger<OpencodeServer>()

/** Current server state, mirrored to the webview as a `server-status` message. */
data class ServerStatus(
  val state: String, // "starting" | "connected" | "error" | "stopped"
  val url: String? = null,
  val managed: Boolean = true,
  val message: String? = null,
)

/**
 * Spawns and supervises `opencode serve` for a project, parsing the URL it
 * prints. Kotlin counterpart of the VS Code extension's ServerManager.
 */
class OpencodeServer(
  private val workingDir: String,
  private val binary: String = "opencode",
  private val overrideUrl: String? = null,
  private val onStatus: (ServerStatus) -> Unit,
) {
  @Volatile var status: ServerStatus = ServerStatus("stopped")
    private set

  private var process: Process? = null
  private val disposed = AtomicBoolean(false)
  private var restarts = 0

  private fun setStatus(s: ServerStatus) {
    status = s
    onStatus(s)
  }

  fun start() {
    val override = overrideUrl?.trim().orEmpty()
    if (override.isNotEmpty()) {
      setStatus(ServerStatus("connected", url = override, managed = false))
      return
    }
    spawn()
  }

  private fun spawn() {
    setStatus(ServerStatus("starting"))
    val urlFuture = CompletableFuture<String>()
    try {
      val proc = ProcessBuilder(binary, "serve", "--hostname=127.0.0.1", "--port=0", "--print-logs")
        .directory(java.io.File(workingDir))
        .redirectErrorStream(true)
        .start()
      process = proc

      Thread({
        BufferedReader(InputStreamReader(proc.inputStream)).use { reader ->
          reader.lineSequence().forEach { line ->
            LOG.info("[opencode] $line")
            if (!urlFuture.isDone && line.contains("opencode server listening")) {
              val match = Regex("on\\s+(https?://[^\\s]+)").find(line)
              if (match != null) urlFuture.complete(match.groupValues[1].trim())
            }
          }
        }
        // Stream ended -> process exited.
        onExit(proc.waitFor())
      }, "opencode-server-reader").apply { isDaemon = true }.start()
    } catch (t: Throwable) {
      setStatus(ServerStatus("error", message = "Failed to launch '$binary': ${t.message}. Is it on your PATH?"))
      return
    }

    try {
      val url = urlFuture.get(60, TimeUnit.SECONDS)
      restarts = 0
      setStatus(ServerStatus("connected", url = url, managed = true))
    } catch (t: Throwable) {
      setStatus(ServerStatus("error", message = "Timed out waiting for the opencode server to start."))
      stop()
    }
  }

  private fun onExit(code: Int) {
    if (disposed.get()) return
    process = null
    if (restarts >= 5) {
      setStatus(ServerStatus("error", message = "opencode server crashed repeatedly. Check the logs and retry."))
      return
    }
    restarts++
    setStatus(ServerStatus("error", message = "Server exited (code $code). Restarting…"))
    Thread.sleep(minOf(1000L * (1 shl restarts), 15000L))
    if (!disposed.get()) spawn()
  }

  fun restart() {
    stop()
    restarts = 0
    start()
  }

  fun stop() {
    process?.destroy()
    process = null
  }

  fun dispose() {
    disposed.set(true)
    stop()
  }
}
