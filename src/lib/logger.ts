// Simple logger that writes to a file via Tauri
import { invoke } from "@tauri-apps/api/core";

interface LogEntry {
  timestamp: string;
  level: "trace" | "info" | "warn" | "error";
  message: string;
  context?: string;
  data?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  log(
    level: LogEntry["level"],
    message: string,
    context?: string,
    data?: unknown,
  ) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data: data !== undefined ? JSON.stringify(data, null, 2) : undefined,
    };

    this.logs.push(entry);

    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Also log to console
    const consoleMethod =
      level === "error"
        ? console.error
        : level === "warn"
          ? console.warn
          : level === "info"
            ? console.info
            : console.log;

    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]${context ? ` [${context}]` : ""}`;
    consoleMethod(prefix, message, data || "");

    // Try to write to file (non-blocking)
    this.writeToFile(entry).catch((err: unknown) => {
      console.error("Failed to write log to file:", err);
    });
  }

  private async writeToFile(entry: LogEntry) {
    try {
      await invoke("write_log", {
        logEntry: JSON.stringify(entry),
      });
    } catch (_err) {
      // Ignore errors - logging should not break the app
    }
  }

  trace(message: string, context?: string, data?: unknown) {
    this.log("trace", message, context, data);
  }

  info(message: string, context?: string, data?: unknown) {
    this.log("info", message, context, data);
  }

  warn(message: string, context?: string, data?: unknown) {
    this.log("warn", message, context, data);
  }

  error(message: string, context?: string, data?: unknown) {
    this.log("error", message, context, data);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  async exportLogs(): Promise<string> {
    try {
      const logs = this.getLogs();
      return await invoke("export_logs", {
        logs: JSON.stringify(logs, null, 2),
      });
    } catch (err) {
      throw new Error(`Failed to export logs: ${err}`);
    }
  }

  clear() {
    this.logs = [];
  }
}

export const logger = new Logger();
