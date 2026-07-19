import * as vscode from "vscode";

function nonce(): string {
  let text = "";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) text += chars.charAt(Math.floor(Math.random() * chars.length));
  return text;
}

/**
 * Build the webview HTML. Loads the Vite bundle emitted into media/webview/,
 * with a strict CSP. `img-src ... data:` is required for attachment thumbnails.
 */
export function renderWebviewHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const base = vscode.Uri.joinPath(extensionUri, "media", "webview");
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(base, "index.js"));
  const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(base, "index.css"));
  const n = nonce();
  const csp = [
    `default-src 'none'`,
    `img-src ${webview.cspSource} data: blob:`,
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `script-src 'nonce-${n}'`,
    `font-src ${webview.cspSource}`,
  ].join("; ");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="${csp}" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="${styleUri}" />
    <title>opencode</title>
  </head>
  <body>
    <div id="root"></div>
    <script nonce="${n}" src="${scriptUri}"></script>
  </body>
</html>`;
}
