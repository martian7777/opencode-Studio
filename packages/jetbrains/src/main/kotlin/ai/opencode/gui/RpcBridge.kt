package ai.opencode.gui

import com.google.gson.JsonElement
import com.google.gson.JsonObject

/**
 * Maps webview RPC method names to opencode HTTP calls — the Kotlin equivalent
 * of the extension host's dispatch table. Method names must match
 * `@opencode-gui/shared`'s RpcRequests.
 */
class RpcBridge(private val api: OpencodeApi) {

  fun dispatch(method: String, params: JsonObject): JsonElement = when (method) {
    "server.status" -> api.path()
    "app.agents" -> api.agents()
    "config.providers" -> api.providers()
    "config.get" -> api.providers() // placeholder; config.get not required by GUI
    "command.list" -> api.commands()
    "session.list" -> api.sessions()
    "session.create" -> api.createSession(params)
    "session.get" -> api.getSession(params.get("id").asString)
    "session.messages" -> api.messages(params.get("id").asString)
    "session.abort" -> api.abort(params.get("id").asString)
    "session.prompt" -> api.prompt(params)
    "session.command" -> api.command(params)
    "find.files" -> api.findFiles(params.get("query").asString)
    "find.text" -> api.findText(params.get("pattern").asString)
    "find.symbols" -> api.findSymbols(params.get("query").asString)
    else -> throw IllegalArgumentException("Unknown RPC method: $method")
  }
}
