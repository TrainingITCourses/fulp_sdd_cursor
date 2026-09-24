export const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

/** Extra values are passed to the console untouched so objects stay inspectable. */
type LogMethod = (message: string, ...details: unknown[]) => void;

export interface Logger {
  debug: LogMethod;
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
}

export interface LoggerOptions {
  level?: LogLevel;
}

/** localStorage key that overrides the minimum level, e.g. `localStorage.logLevel = "debug"`. */
export const LOG_LEVEL_KEY = "logLevel";
const DEFAULT_LEVEL: LogLevel = "info";
const LEVEL_WIDTH = Math.max(...LOG_LEVELS.map((level) => level.length));
const SOURCE_MAX_LENGTH = 10;
const SOURCE_WIDTH = SOURCE_MAX_LENGTH + 2;

const pad2 = (value: number): string => String(value).padStart(2, "0");

const isLogLevel = (value: string): value is LogLevel =>
  (LOG_LEVELS as readonly string[]).includes(value);

/** Parses a level name; anything missing or unknown falls back to `info`. */
export const parseLogLevel = (value: string | null | undefined): LogLevel => {
  const normalized = value?.trim().toLowerCase() ?? "";
  return isLogLevel(normalized) ? normalized : DEFAULT_LEVEL;
};

/** Reads the level override; storage may be missing or blocked (private mode, tests). */
const readStoredLevel = (): LogLevel => {
  try {
    return parseLogLevel(globalThis.localStorage.getItem(LOG_LEVEL_KEY));
  } catch {
    return DEFAULT_LEVEL;
  }
};

/** Console prefix with fixed-width columns: `HH:mm:ss.SSS LEVEL [source]  `. */
export const formatLogPrefix = (date: Date, level: LogLevel, source: string): string => {
  const time = `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}.${String(date.getMilliseconds()).padStart(3, "0")}`;
  const tag = `[${source.trim().slice(0, SOURCE_MAX_LENGTH)}]`.padEnd(SOURCE_WIDTH);
  return `${time} ${level.toUpperCase().padEnd(LEVEL_WIDTH)} ${tag}`;
};

/**
 * Creates a browser console logger for one source (a page, store, component...).
 * The minimum level comes from `options.level`, then `localStorage.logLevel`, then `info`.
 */
export const createLogger = (source: string, options: Readonly<LoggerOptions> = {}): Logger => {
  const minRank = LOG_LEVELS.indexOf(options.level ?? readStoredLevel());

  const logAt =
    (level: LogLevel): LogMethod =>
    (message, ...details) => {
      if (LOG_LEVELS.indexOf(level) < minRank) {
        return;
      }
      console[level](formatLogPrefix(new Date(), level, source), message, ...details);
    };

  return { debug: logAt("debug"), info: logAt("info"), warn: logAt("warn"), error: logAt("error") };
};
