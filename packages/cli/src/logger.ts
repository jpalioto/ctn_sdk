/**
 * Configurable structured logging for the CTN server.
 * Supports log levels and prompt redaction for compliance.
 */

/**
 * Log levels in order of verbosity.
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

/**
 * Numeric values for log level comparison.
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

/**
 * Configuration for the logger.
 */
export interface LoggerConfig {
  /** Minimum log level to output. Default: 'info' */
  level: LogLevel;
  /** If true, redact prompt content in logs. Default: false */
  redactPrompts: boolean;
  /** Custom output function for testing. Default: console.log */
  output?: (json: string) => void;
}

/**
 * Structured log entry.
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  [key: string]: unknown;
}

/**
 * Request log entry with optional debug fields.
 */
export interface RequestLogEntry {
  timestamp: string;
  method: string;
  path: string;
  status: number;
  duration_ms: number;
  provider?: string;
  /** Only included at debug level */
  input?: string;
  /** Only included at debug level */
  output_length?: number;
  /** Only included at debug level */
  tokens_in?: number;
  /** Only included at debug level */
  tokens_out?: number;
}

/**
 * Logger interface for the CTN server.
 */
export interface Logger {
  /** Log an error message. Always outputs regardless of level. */
  error(message: string, data?: Record<string, unknown>): void;
  /** Log a warning message. Outputs at warn level and above. */
  warn(message: string, data?: Record<string, unknown>): void;
  /** Log an info message. Outputs at info level and above. */
  info(message: string, data?: Record<string, unknown>): void;
  /** Log a debug message. Only outputs at debug level. */
  debug(message: string, data?: Record<string, unknown>): void;
  /** Log a request entry (at info level). */
  logRequest(entry: RequestLogEntry): void;
  /** Redact text if redactPrompts is enabled. */
  redact(text: string): string;
  /** Check if a log level is enabled. */
  isLevelEnabled(level: LogLevel): boolean;
  /** Get the current configuration. */
  readonly config: Readonly<LoggerConfig>;
}

/**
 * Default logger configuration.
 */
export const defaultLoggerConfig: LoggerConfig = {
  level: 'info',
  redactPrompts: false,
};

/**
 * Creates a configured logger instance.
 *
 * @param config - Logger configuration
 * @returns Logger instance
 */
export function createLogger(config: Partial<LoggerConfig> = {}): Logger {
  const fullConfig: LoggerConfig = {
    ...defaultLoggerConfig,
    ...config,
  };

  const output = fullConfig.output ?? ((json: string) => console.log(json));
  const currentLevel = LOG_LEVELS[fullConfig.level];

  const isLevelEnabled = (level: LogLevel): boolean => {
    return LOG_LEVELS[level] <= currentLevel;
  };

  const log = (level: LogLevel, message: string, data?: Record<string, unknown>): void => {
    if (!isLevelEnabled(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...data,
    };

    output(JSON.stringify(entry));
  };

  const redact = (text: string): string => {
    return fullConfig.redactPrompts ? '[REDACTED]' : text;
  };

  const logRequest = (entry: RequestLogEntry): void => {
    if (!isLevelEnabled('info')) {
      return;
    }

    // Apply redaction to input if present
    const logEntry = { ...entry };
    if (logEntry.input !== undefined && fullConfig.redactPrompts) {
      logEntry.input = '[REDACTED]';
    }

    output(JSON.stringify(logEntry));
  };

  return {
    error: (message, data) => log('error', message, data),
    warn: (message, data) => log('warn', message, data),
    info: (message, data) => log('info', message, data),
    debug: (message, data) => log('debug', message, data),
    logRequest,
    redact,
    isLevelEnabled,
    config: fullConfig,
  };
}

/**
 * Silent logger for testing - outputs nothing.
 */
export const silentLogger: Logger = {
  error: () => {},
  warn: () => {},
  info: () => {},
  debug: () => {},
  logRequest: () => {},
  redact: (text) => text,
  isLevelEnabled: () => false,
  config: { level: 'error', redactPrompts: false },
};

/**
 * Validates a log level string.
 *
 * @param level - String to validate
 * @returns True if valid log level
 */
export function isValidLogLevel(level: string): level is LogLevel {
  return level in LOG_LEVELS;
}

/**
 * Parses a log level string, with validation.
 *
 * @param level - String to parse
 * @param defaultLevel - Default level if invalid
 * @returns Validated log level
 */
export function parseLogLevel(level: string, defaultLevel: LogLevel = 'info'): LogLevel {
  const normalized = level.toLowerCase();
  return isValidLogLevel(normalized) ? normalized : defaultLevel;
}
