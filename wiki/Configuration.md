# Configuration

All settings, commands, and customization options for opencode Studio.

---

## Extension Settings

### `opencode.serverUrl`

- **Type**: `string`
- **Default**: `""` (empty — auto-spawn)

Connect to an already-running opencode server. Leave empty to auto-spawn.

```json
{ "opencode.serverUrl": "http://localhost:4096" }
```

### `opencode.binaryPath`

- **Type**: `string`
- **Default**: `"opencode"`

Path to the opencode executable. Only used when auto-spawning.

```json
{ "opencode.binaryPath": "/usr/local/bin/opencode" }
```

---

## Commands

| Command | Description |
| :--- | :--- |
| `opencode: Open in Editor Tab` | Open the GUI as a full editor tab |
| `opencode: New Session` | Start a fresh conversation |
| `opencode: Restart Server` | Restart the managed server |

---

## Environment Variables

| Variable | Purpose |
| :--- | :--- |
| `PATH` | Locates the `opencode` binary |
| `OPENAI_API_KEY` | OpenAI provider auth |
| `ANTHROPIC_API_KEY` | Anthropic provider auth |

---

## Recommended Setups

**Minimal** — no config needed, just install opencode and the extension.

**Team server:**
```json
{ "opencode.serverUrl": "http://team-server:4096" }
```

**Custom binary:**
```json
{ "opencode.binaryPath": "C:\\tools\\opencode.exe" }
```
