package ai.opencode.gui

import com.google.gson.Gson
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import com.intellij.openapi.diagnostic.logger
import java.net.URI
import java.net.URLEncoder
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.nio.charset.StandardCharsets
import java.time.Duration
import java.util.concurrent.atomic.AtomicBoolean

private val LOG = logger<OpencodeApi>()
private val GSON = Gson()

/**
 * Thin HTTP client for the opencode server REST + SSE API. Reimplements the
 * subset of @opencode-ai/sdk that the GUI needs, since the Kotlin host cannot
 * use the JS SDK. Endpoint verbs/paths were taken from the SDK's generated code.
 */
class OpencodeApi(private val baseUrl: String) {
  private val http: HttpClient = HttpClient.newBuilder()
    .connectTimeout(Duration.ofSeconds(10))
    .build()

  private fun get(path: String): JsonElement = send("GET", path, null)
  private fun post(path: String, body: JsonElement?): JsonElement = send("POST", path, body)

  private fun send(method: String, path: String, body: JsonElement?): JsonElement {
    val builder = HttpRequest.newBuilder(URI.create(baseUrl + path))
      .timeout(Duration.ofMinutes(10))
      .header("Content-Type", "application/json")
    when (method) {
      "GET" -> builder.GET()
      "POST" -> builder.POST(
        if (body == null) HttpRequest.BodyPublishers.noBody()
        else HttpRequest.BodyPublishers.ofString(GSON.toJson(body)),
      )
    }
    val res = http.send(builder.build(), HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8))
    if (res.statusCode() >= 400) {
      throw RuntimeException("HTTP ${res.statusCode()} on $method $path: ${res.body()}")
    }
    val text = res.body()
    return if (text.isNullOrBlank()) JsonObject() else GSON.fromJson(text, JsonElement::class.java)
  }

  private fun enc(v: String) = URLEncoder.encode(v, StandardCharsets.UTF_8)

  // ---- endpoints (params come from the webview's RPC payload) ---------------

  fun path(): JsonElement = get("/path")
  fun agents(): JsonElement = get("/agent")
  fun providers(): JsonElement = get("/config/providers")
  fun commands(): JsonElement = get("/command")
  fun sessions(): JsonElement = get("/session")

  fun createSession(p: JsonObject): JsonElement {
    val body = JsonObject()
    p.get("title")?.let { body.add("title", it) }
    p.get("parentID")?.let { body.add("parentID", it) }
    return post("/session", body)
  }

  fun getSession(id: String): JsonElement = get("/session/${enc(id)}")
  fun messages(id: String): JsonElement = get("/session/${enc(id)}/message")
  fun abort(id: String): JsonElement = post("/session/${enc(id)}/abort", null)

  fun prompt(p: JsonObject): JsonElement {
    val id = p.get("id").asString
    val body = JsonObject().apply {
      add("parts", p.get("parts"))
      p.get("model")?.takeIf { !it.isJsonNull }?.let { add("model", it) }
      p.get("agent")?.takeIf { !it.isJsonNull }?.let { add("agent", it) }
    }
    return post("/session/${enc(id)}/message", body)
  }

  fun command(p: JsonObject): JsonElement {
    val id = p.get("id").asString
    val body = JsonObject().apply {
      addProperty("command", p.get("command").asString)
      addProperty("arguments", p.get("arguments")?.takeIf { !it.isJsonNull }?.asString ?: "")
      p.get("agent")?.takeIf { !it.isJsonNull }?.let { add("agent", it) }
      p.get("model")?.takeIf { !it.isJsonNull }?.let { m ->
        val mo = m.asJsonObject
        addProperty("model", "${mo.get("providerID").asString}/${mo.get("modelID").asString}")
      }
    }
    return post("/session/${enc(id)}/command", body)
  }

  fun findFiles(query: String): JsonElement = get("/find/file?query=${enc(query)}")
  fun findText(pattern: String): JsonElement = get("/find?pattern=${enc(pattern)}")
  fun findSymbols(query: String): JsonElement = get("/find/symbol?query=${enc(query)}")

  /**
   * Subscribe to the SSE event stream, invoking [onEvent] for each event.
   * Returns a stopper; reconnects until stopped.
   */
  fun subscribeEvents(onEvent: (JsonElement) -> Unit): () -> Unit {
    val stopped = AtomicBoolean(false)
    val thread = Thread({
      while (!stopped.get()) {
        try {
          val req = HttpRequest.newBuilder(URI.create("$baseUrl/event"))
            .timeout(Duration.ofHours(24))
            .GET()
            .build()
          val res = http.send(req, HttpResponse.BodyHandlers.ofLines())
          res.body().forEach { line ->
            if (stopped.get()) return@forEach
            if (line.startsWith("data:")) {
              val json = line.substring(5).trim()
              if (json.isNotEmpty()) {
                runCatching { onEvent(GSON.fromJson(json, JsonElement::class.java)) }
                  .onFailure { LOG.debug("bad SSE payload", it) }
              }
            }
          }
        } catch (t: Throwable) {
          if (!stopped.get()) LOG.debug("SSE stream error; retrying", t)
        }
        if (!stopped.get()) Thread.sleep(1000)
      }
    }, "opencode-sse").apply { isDaemon = true }
    thread.start()
    return { stopped.set(true) }
  }
}
