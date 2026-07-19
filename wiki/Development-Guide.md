# Development Guide

Build from source, run tests, and contribute to opencode Studio.

---

## Prerequisites

- **Node.js** ≥ 18
- **npm** (included with Node.js)
- **VS Code** (for running the extension in development)
- **opencode** CLI installed

---

## Setup

```bash
git clone https://github.com/martian7777/opencode-gui.git
cd opencode-gui
npm install
```

---

## Build

```bash
npm run build              # Build everything (webview + extension)
npm run build:webview      # Build only the React webview
npm run build:extension    # Build only the extension host
```

The webview builds with **Vite** into `packages/extension/media/webview/`.
The extension builds with **esbuild** into `packages/extension/dist/`.

---

## Run in Development

1. Open the repo in VS Code
2. Press `F5` (or Run → Start Debugging)
3. This launches an **Extension Development Host** window
4. The opencode icon appears in the Activity Bar

### Watch Mode

```bash
npm run watch    # Rebuilds both packages on file changes
```

---

## Test

```bash
npm test    # Run webview unit tests (Vitest)
```

---

## Package

```bash
npm run package    # Produces opencode-gui.vsix
```

The VSIX is created at `packages/extension/opencode-gui.vsix`.

---

## Project Structure

```
opencode-gui/
├── packages/
│   ├── shared/        # Typed RPC protocol (shared types)
│   │   └── src/protocol.ts
│   ├── webview/       # React GUI (Vite + Tailwind)
│   │   └── src/
│   │       ├── components/   # UI components
│   │       ├── lib/          # Utilities
│   │       └── state/        # State management
│   └── extension/     # VS Code extension host (esbuild)
│       └── src/
│           ├── extension.ts  # Entry point
│           ├── server.ts     # Server lifecycle
│           ├── rpc.ts        # RPC handler
│           └── webview.ts    # Webview panel
├── .github/workflows/
│   ├── ci.yml         # PR checks
│   └── release.yml    # Auto-publish on tag
└── package.json       # Monorepo root
```

---

## Publishing

Push a version tag and CI publishes automatically:

```bash
# 1. Bump version in packages/extension/package.json
# 2. Commit and tag
git tag v0.1.3 && git push origin v0.1.3
```

CI publishes to both **VS Code Marketplace** and **Open VSX**.

**Required repo secrets:**

| Secret | Purpose |
| :--- | :--- |
| `VSCE_PAT` | Azure DevOps PAT for VS Code Marketplace |
| `OVSX_PAT` | Open VSX access token |

---

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feat/my-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit: `git commit -m 'feat: add my feature'`
6. Push: `git push origin feat/my-feature`
7. Open a Pull Request
