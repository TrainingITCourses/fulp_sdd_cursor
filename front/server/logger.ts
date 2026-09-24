import { appendFileSync, mkdirSync } from "node:fs";
import path from "node:path";

export const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export interface Logger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

export interface LoggerOptions {
  dir?: string;
  level?: LogLevel;
}

const DEFAULT_LEVEL: LogLevel = "info";
const DEFAULT_DIR = "./logs";
const LEVEL_WIDTH = Math.max(...LOG_LEVELS.map((level) => level.length));
const SOURCE_MAX_LENGTH = 10;
const SOURCE_WIDTH = SOURCE_MAX_LENGTH + 2;

const pad2 = (value: number): string => String(value).padStart(2, "0");

const isLogLevel = (value: string): value is LogLevel =>
  (LOG_LEVELS as readonly string[]).includes(value);

/** Parses a `LOG_LEVEL` value; anything missing or unknown falls back to `info`. */
export const parseLogLevel = (value: string | undefined): LogLevel => {
  const normalized = value?.trim().toLowerCase() ?? "";
  return isLogLevel(normalized) ? normalized : DEFAULT_LEVEL;
};

/** Local date as `yyyy-mm-dd`, used as the daily file name. */
export const formatLogDate = (date: Date): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const formatLogTime = (date: Date): string =>
  `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}.${String(date.getMilliseconds()).padStart(3, "0")}`;

const formatSource = (source: string): string =>
  `[${source.trim().slice(0, SOURCE_MAX_LENGTH)}]`.padEnd(SOURCE_WIDTH);

const formatMessage = (message: string): string =>
  message.trim().replaceAll(/\r\n|\r|\n/gu, String.raw`\n`);

/** One log line, without trailing newline: `HH:mm:ss.SSS LEVEL [source] message`. */
export const formatLogLine = (
  date: Date,
  level: LogLevel,
  source: string,
  message: string,
): string =>
  `${formatLogTime(date)} ${level.toUpperCase().padEnd(LEVEL_WIDTH)} ${formatSource(source)} ${formatMessage(message)}`;

const writeToConsole = (level: LogLevel, line: string): void => {
  const stream = level === "warn" || level === "error" ? process.stderr : process.stdout;
  stream.write(`${line}\n`);
};

/** Appends lines to the daily file; after the first failure it warns once and stops trying. */
const createFileWriter = (dir: string): ((date: Date, line: string) => void) => {
  let enabled = true;
  return (date, line) => {
    if (!enabled) {
      return;
    }
    try {
      mkdirSync(dir, { recursive: true });
      appendFileSync(path.join(dir, `${formatLogDate(date)}.log`), `${line}\n`);
    } catch (error) {
      enabled = false;
      const reason = error instanceof Error ? error.message : String(error);
      process.stderr.write(`Logger: cannot write to ${dir} (${reason}); logging to console only\n`);
    }
  };
};

/**
 * Creates a logger that appends to `dir/yyyy-mm-dd.log` and echoes to the console.
 * Defaults come from `LOG_DIR` and `LOG_LEVEL`. File errors never throw: they are
 * reported once on stderr and the logger continues on the console only.
 */
export const createLogger = (source: string, options: LoggerOptions = {}): Logger => {
  const writeToFile = createFileWriter(options.dir ?? process.env["LOG_DIR"] ?? DEFAULT_DIR);
  const minLevel = options.level ?? parseLogLevel(process.env["LOG_LEVEL"]);
  const minRank = LOG_LEVELS.indexOf(minLevel);

  const logAt =
    (level: LogLevel) =>
    (message: string): void => {
      if (LOG_LEVELS.indexOf(level) < minRank) {
        return;
      }
      const date = new Date();
      const line = formatLogLine(date, level, source, message);
      writeToFile(date, line);
      writeToConsole(level, line);
    };

  return { debug: logAt("debug"), info: logAt("info"), warn: logAt("warn"), error: logAt("error") };
};
