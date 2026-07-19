package ai.opencode.gui

import com.google.gson.Gson
import com.google.gson.JsonObject
import com.intellij.openapi.Disposable
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.project.Project
import com.intellij.openapi.util.Disposer
import com.intellij.openapi.wm.ToolWindow
import com.intellij.openapi.wm.ToolWindowFactory
import com.intellij.ui.jcef.JBCefApp
import com.intellij.ui.jcef.JBCefBrowser
import com.intellij.ui.jcef.JBCefBrowserBase
import com.intellij.ui.jcef.JBCefJSQuery
import javax.swing.JLabel

private val GSON = Gson()

class OpencodeToolWindowFactory : ToolWindowFactory {
  override fun createToolWindowContent(project: Project, toolWindow: ToolWindow) {
    val content = toolWindow.contentManager
    if (!JBCefApp.isSupported()) {
      val label = JLabel("This IDE build does not support the embedded browser (JCEF) required by opencode GUI.")
      content.addContent(content.factory.createContent(label, "", false))
      return
    }
    val panel = OpencodeWebviewPanel(project)
    Disposer.register(toolWindow.disposable, panel)
    content.addContent(content.factory.createContent(panel.browser.component, "", false))
  }
}

/**
 * Hosts the shared web GUI in a JCEF browser and bridges it to opencode.
 *
 * The web bundle expects a VS Code webview host (`acquireVsCodeApi()` +
 * `window.postMessage`). We satisfy that exact contract with a JS shim, so the
 * same React app runs unmodified: JS -> Kotlin via a JBCefJSQuery, Kotlin -> JS
 * via `window.postMessage`.
 */
class OpencodeWebviewPanel(project: Project) : Disposable {
  val browser = JBCefBrowser()
  private val jsQuery = JBCefJSQuery.create(browser as JBCefBrowserBase)

  private val server: OpencodeServer
  private var api: OpencodeApi? = null
  private var stopEvents: (() -> Unit)? = null

  init {
    val workingDir = project.basePath ?: System.getProperty("user.dir")
    val settings = OpencodeSettings.getInstance()
    server = OpencodeServer(
      workingDir = workingDir,
      binary = settings.binaryPath,
      overrideUrl = settings.serverUrl.ifEmpty { null },
      onStatus = { status -> onServerStatus(status) },
    )

    jsQuery.addHandler { request ->
      handleWebviewMessage(request)
      null
    }

    browser.loadHTML(buildHtml())
    server.start()
  }

  // ---- webview -> host ------------------------------------------------------

  private fun handleWebviewMessage(request: String) {
    val msg = runCatching { GSON.fromJson(request, JsonObject::class.java) }.getOrNull() ?: return
    when (msg.get("kind")?.asString) {
      "webview-ready" -> postToJs(statusMessage(server.status))
      "server-restart" -> server.restart()
      "rpc-request" -> handleRpc(msg)
    }
  }

  private fun handleRpc(msg: JsonObject) {
    val id = msg.get("id").asInt
    val method = msg.get("method").asString
    val params = msg.get("params")?.takeIf { it.isJsonObject }?.asJsonObject ?: JsonObject()

    ApplicationManager.getApplication().executeOnPooledThread {
      val response = JsonObject().apply {
        addProperty("kind", "rpc-response")
        addProperty("id", id)
      }
      try {
        val client = api ?: throw IllegalStateException("opencode server is not connected yet.")
        response.add("result", RpcBridge(client).dispatch(method, params))
      } catch (t: Throwable) {
        response.add("error", JsonObject().apply { addProperty("message", t.message ?: t.toString()) })
      }
      postToJs(GSON.toJson(response))
    }
  }

  // ---- host -> webview ------------------------------------------------------

  private fun onServerStatus(status: ServerStatus) {
    stopEvents?.invoke()
    stopEvents = null
    if (status.state == "connected" && status.url != null) {
      val client = OpencodeApi(status.url)
      api = client
      stopEvents = client.subscribeEvents { event ->
        val env = JsonObject().apply {
          addProperty("kind", "event")
          add("event", event)
        }
        postToJs(GSON.toJson(env))
      }
    } else {
      api = null
    }
    postToJs(statusMessage(status))
  }

  private fun statusMessage(status: ServerStatus): String {
    val statusObj = JsonObject().apply {
      addProperty("state", status.state)
      addProperty("managed", status.managed)
      status.url?.let { addProperty("url", it) }
      status.message?.let { addProperty("message", it) }
    }
    return GSON.toJson(JsonObject().apply {
      addProperty("kind", "server-status")
      add("status", statusObj)
    })
  }

  private fun postToJs(json: String) {
    // json is a JSON object literal => valid JS. Code points 0x2028/0x2029 are
    // legal inside JSON strings but terminate a JS line, so escape them.
    val sb = StringBuilder(json.length)
    for (c in json) {
      when (c.code) {
        0x2028 -> sb.append("\\u2028")
        0x2029 -> sb.append("\\u2029")
        else -> sb.append(c)
      }
    }
    val url = browser.cefBrowser.url ?: ""
    browser.cefBrowser.executeJavaScript("window.postMessage($sb, '*');", url, 0)
  }

  // ---- page -----------------------------------------------------------------

  private fun buildHtml(): String {
    // Escape any closing tags so inlined content can't break out of its element.
    val css = readResource("/webview/index.css").replace("</style", "<\\/style")
    val js = readResource("/webview/index.js").replace("</script", "<\\/script")
    // `inject("payload")` emits the JS that ships the `payload` variable to Kotlin.
    val send = jsQuery.inject("payload")
    return """
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <style>$css</style>
    <script>
      window.acquireVsCodeApi = function () {
        return {
          postMessage: function (msg) { var payload = JSON.stringify(msg); $send },
          getState: function () { return undefined; },
          setState: function () {}
        };
      };
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">$js</script>
  </body>
</html>
""".trimIndent()
  }

  private fun readResource(path: String): String =
    javaClass.getResourceAsStream(path)?.use { it.readBytes().toString(Charsets.UTF_8) }
      ?: error("Missing bundled resource: $path (run `npm run build:webview`)")

  override fun dispose() {
    stopEvents?.invoke()
    server.dispose()
    Disposer.dispose(jsQuery)
    Disposer.dispose(browser)
  }
}
