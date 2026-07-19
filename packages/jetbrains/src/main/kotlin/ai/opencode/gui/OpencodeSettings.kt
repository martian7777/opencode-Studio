package ai.opencode.gui

import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.components.PersistentStateComponent
import com.intellij.openapi.components.Service
import com.intellij.openapi.components.State
import com.intellij.openapi.components.Storage

/**
 * Persisted plugin settings — the JetBrains equivalent of the VS Code
 * `opencode.serverUrl` / `opencode.binaryPath` configuration.
 */
@Service(Service.Level.APP)
@State(name = "OpencodeGuiSettings", storages = [Storage("opencode-gui.xml")])
class OpencodeSettings : PersistentStateComponent<OpencodeSettings.State> {
  data class State(
    var serverUrl: String = "",
    var binaryPath: String = "opencode",
  )

  private var state = State()

  override fun getState(): State = state
  override fun loadState(loaded: State) {
    state = loaded
  }

  /** Blank means "auto-spawn a managed server". */
  var serverUrl: String
    get() = state.serverUrl.trim()
    set(value) {
      state.serverUrl = value.trim()
    }

  var binaryPath: String
    get() = state.binaryPath.trim().ifEmpty { "opencode" }
    set(value) {
      state.binaryPath = value.trim().ifEmpty { "opencode" }
    }

  companion object {
    fun getInstance(): OpencodeSettings =
      ApplicationManager.getApplication().getService(OpencodeSettings::class.java)
  }
}
