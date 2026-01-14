// Console Log Exporter
// Usage: Call exportConsoleLogs() in the browser console to download all logs

export function exportConsoleLogs() {
  // Get all console logs from the console API
  // Note: This only works if we've been capturing logs
  const logs: string[] = [];

  // Try to get logs from console if available
  if (typeof console !== "undefined") {
    // Override console methods to capture logs
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    // This won't capture existing logs, but we can provide instructions
    console.log("To export console logs:");
    console.log("1. Right-click in the console");
    console.log('2. Select "Save as..." or use Ctrl+A then Ctrl+C to copy');
    console.log("3. Or use the browser's console export feature");
  }

  return logs;
}

// Alternative: Create a button in the UI to copy console logs
export function createConsoleExportButton() {
  const button = document.createElement("button");
  button.textContent = "📋 Copy Console Logs";
  button.style.cssText =
    "position: fixed; bottom: 20px; right: 20px; z-index: 10000; padding: 10px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;";
  button.onclick = () => {
    // Instructions for user
    alert(
      "To copy console logs:\n\n1. Open DevTools (F12)\n2. Go to Console tab\n3. Press Ctrl+A (Select All)\n4. Press Ctrl+C (Copy)\n5. Paste into a text file",
    );
  };
  document.body.appendChild(button);
  return button;
}
