package ai.opencode.gui

import com.intellij.openapi.options.Configurable
import com.intellij.ui.components.JBTextField
import com.intellij.util.ui.FormBuilder
import javax.swing.JComponent
import javax.swing.JPanel

/** Settings > Tools > opencode GUI. */
class OpencodeConfigurable : Configurable {
  private var urlField: JBTextField? = null
  private var binaryField: JBTextField? = null

  override fun getDisplayName(): String = "opencode GUI"

  override fun createComponent(): JComponent {
    val s = OpencodeSettings.getInstance()
    val url = JBTextField(s.serverUrl).also { urlField = it }
    val binary = JBTextField(s.binaryPath).also { binaryField = it }
    return FormBuilder.createFormBuilder()
      .addLabeledComponent("Server URL (blank = auto-spawn):", url)
      .addLabeledComponent("opencode binary path:", binary)
      .addComponentToRightColumn(
        com.intellij.ui.components.JBLabel(
          "Changes apply the next time the opencode tool window is opened, or on Restart.",
        ),
      )
      .addComponentFillVertically(JPanel(), 0)
      .panel
  }

  override fun isModified(): Boolean {
    val s = OpencodeSettings.getInstance()
    return urlField?.text?.trim() != s.serverUrl || binaryField?.text?.trim() != s.binaryPath
  }

  override fun apply() {
    val s = OpencodeSettings.getInstance()
    s.serverUrl = urlField?.text ?: ""
    s.binaryPath = binaryField?.text ?: "opencode"
  }

  override fun reset() {
    val s = OpencodeSettings.getInstance()
    urlField?.text = s.serverUrl
    binaryField?.text = s.binaryPath
  }

  override fun disposeUIResources() {
    urlField = null
    binaryField = null
  }
}
