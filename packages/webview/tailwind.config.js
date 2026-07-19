/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Map to VS Code theme variables so the GUI matches any IDE theme.
        editor: "var(--vscode-editor-background)",
        fg: "var(--vscode-foreground)",
        muted: "var(--vscode-descriptionForeground)",
        border: "var(--vscode-panel-border)",
        accent: "var(--vscode-focusBorder)",
        input: "var(--vscode-input-background)",
      },
    },
  },
  plugins: [],
};
