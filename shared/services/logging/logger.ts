/**
 * Logger Service
 * Centralized logging system with multiple output targets and log levels
 */

// Log levels in order of severity
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
  NONE = 5 // Used to disable logging
}

// Log entry structure
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
  data?: Record<string, unknown>;
}

// Log output target interface
export interface LogTarget {
  log(entry: LogEntry): void;
}

// Console log target implementation
export class ConsoleLogTarget implements LogTarget {
  log(entry: LogEntry): void {
    const formattedData = entry.data ? JSON.stringify(entry.data, null, 2) : '';
    const timestamp = entry.timestamp;
    const prefix = `[${timestamp}] [${LogLevel[entry.level]}] [${entry.source}]`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(`${prefix} ${entry.message}`, formattedData ? '\n' + formattedData : '');
        break;
      case LogLevel.INFO:
        console.info(`${prefix} ${entry.message}`, formattedData ? '\n' + formattedData : '');
        break;
      case LogLevel.WARN:
        console.warn(`${prefix} ${entry.message}`, formattedData ? '\n' + formattedData : '');
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(`${prefix} ${entry.message}`, formattedData ? '\n' + formattedData : '');
        break;
    }
  }
}

// Local storage log target implementation
export class LocalStorageLogTarget implements LogTarget {
  private readonly storageKey: string;
  private readonly maxEntries: number;

  constructor(storageKey: string = 'app_logs', maxEntries: number = 1000) {
    this.storageKey = storageKey;
    this.maxEntries = maxEntries;
  }

  log(entry: LogEntry): void {
    try {
      // Get existing logs
      const logsJson = localStorage.getItem(this.storageKey) || '[]';
      const logs = JSON.parse(logsJson) as LogEntry[];

      // Add new log entry
      logs.push(entry);

      // Trim if exceeding max entries
      if (logs.length > this.maxEntries) {
        logs.splice(0, logs.length - this.maxEntries);
      }

      // Save back to localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to write log to localStorage:', error);
    }
  }

  // Get all stored logs
  getLogs(): LogEntry[] {
    try {
      const logsJson = localStorage.getItem(this.storageKey) || '[]';
      return JSON.parse(logsJson) as LogEntry[];
    } catch (error) {
      console.error('Failed to read logs from localStorage:', error);
      return [];
    }
  }

  // Clear all stored logs
  clearLogs(): void {
    localStorage.removeItem(this.storageKey);
  }
}

// Memory log target for testing or in-memory buffering
export class MemoryLogTarget implements LogTarget {
  private logs: LogEntry[] = [];
  private readonly maxEntries: number;

  constructor(maxEntries: number = 1000) {
    this.maxEntries = maxEntries;
  }

  log(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Trim if exceeding max entries
    if (this.logs.length > this.maxEntries) {
      this.logs.splice(0, this.logs.length - this.maxEntries);
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

// Main Logger class
export class Logger {
  private static targets: LogTarget[] = [new ConsoleLogTarget()];
  private static globalLogLevel: LogLevel = LogLevel.INFO;
  private readonly source: string;

  constructor(source: string) {
    this.source = source;
  }

  // Add a log target
  public static addTarget(target: LogTarget): void {
    Logger.targets.push(target);
  }

  // Remove a log target
  public static removeTarget(target: LogTarget): void {
    const index = Logger.targets.indexOf(target);
    if (index !== -1) {
      Logger.targets.splice(index, 1);
    }
  }

  // Clear all targets
  public static clearTargets(): void {
    Logger.targets = [];
  }

  // Set global log level
  public static setGlobalLogLevel(level: LogLevel): void {
    Logger.globalLogLevel = level;
  }

  // Get current global log level
  public static getGlobalLogLevel(): LogLevel {
    return Logger.globalLogLevel;
  }

  // Log a message at the specified level
  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    // Skip if below global log level
    if (level < Logger.globalLogLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      source: this.source,
      message,
      data
    };

    // Send to all targets
    for (const target of Logger.targets) {
      try {
        target.log(entry);
      } catch (error) {
        console.error('Error in log target:', error);
      }
    }
  }

  // Debug level logging
  public debug(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  // Info level logging
  public info(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, data);
  }

  // Warning level logging
  public warn(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, data);
  }

  // Error level logging
  public error(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, data);
  }

  // Critical level logging
  public critical(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.CRITICAL, message, data);
  }
}

// Initialize with default targets
Logger.addTarget(new ConsoleLogTarget());

// For development environments, also log to localStorage
if (process.env.NODE_ENV !== 'production') {
  Logger.addTarget(new LocalStorageLogTarget());
}

// Export a singleton instance for the application logger
export const appLogger = new Logger('App');