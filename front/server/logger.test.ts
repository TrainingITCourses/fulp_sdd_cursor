import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, test } from "node:test";
import { createLogger, formatLogDate, formatLogLine, parseLogLevel } from "./logger.js";

const DATE = new Date(2026, 0, 5, 9, 4, 7, 81);
const MESSAGE_COLUMN = "09:04:07.081 ERROR [errors]     ".length;

const makeTempDir = (): string => mkdtempSync(path.join(tmpdir(), "logger-test-"));
const readTodayLog = (dir: string): string[] =>
  readFileSync(path.join(dir, `${formatLogDate(new Date())}.log`), "utf8")
    .split("\n")
    .filter((line) => line !== "");

void describe("formatLogDate", () => {
  void test("uses the local date as yyyy-mm-dd", () => {
    assert.equal(formatLogDate(DATE), "2026-01-05");
  });
});

void describe("formatLogLine", () => {
  void test("pads time, level and source into fixed columns", () => {
    assert.equal(
      formatLogLine(DATE, "info", "http", "GET /api/health 200 3ms"),
      "09:04:07.081 INFO  [http]       GET /api/health 200 3ms",
    );
  });

  void test("trims the source and truncates it to 10 characters", () => {
    assert.equal(
      formatLogLine(DATE, "debug", "  a-very-long-source ", "x"),
      "09:04:07.081 DEBUG [a-very-lon] x",
    );
  });

  void test("trims the message and escapes line breaks", () => {
    assert.equal(
      formatLogLine(DATE, "error", "errors", "  boom\nat a\r\nat b\r "),
      String.raw`09:04:07.081 ERROR [errors]     boom\nat a\nat b`,
    );
  });

  void test("aligns the message column across levels and sources", () => {
    const lines = [
      formatLogLine(DATE, "debug", "a", "msg"),
      formatLogLine(DATE, "info", "http", "msg"),
      formatLogLine(DATE, "warn", "0123456789", "msg"),
      formatLogLine(DATE, "error", "01234567890123", "msg"),
    ];
    for (const line of lines) {
      assert.equal(line.indexOf("msg"), MESSAGE_COLUMN);
    }
  });
});

void describe("parseLogLevel", () => {
  void test("accepts known levels and defaults to info", () => {
    assert.equal(parseLogLevel("warn"), "warn");
    assert.equal(parseLogLevel(" DEBUG "), "debug");
    assert.equal(parseLogLevel(undefined), "info");
    assert.equal(parseLogLevel("verbose"), "info");
  });
});

const stdout: string[] = [];
const stderr: string[] = [];
const originalStdoutWrite = process.stdout.write.bind(process.stdout);
const originalStderrWrite = process.stderr.write.bind(process.stderr);

/** Captures console output so logger tests stay quiet and can assert on it. */
const captureConsole = (): void => {
  beforeEach(() => {
    stdout.length = 0;
    stderr.length = 0;
    process.stdout.write = (chunk: string) => stdout.push(chunk) > 0;
    process.stderr.write = (chunk: string) => stderr.push(chunk) > 0;
  });
  afterEach(() => {
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
  });
};

void describe("createLogger file output", () => {
  captureConsole();

  void test("appends lines to the daily file, creating the folder", () => {
    const dir = path.join(makeTempDir(), "nested");
    const logger = createLogger("test", { dir });
    logger.info("first");
    logger.info("second");
    const lines = readTodayLog(dir);
    assert.equal(lines.length, 2);
    assert.match(lines[0] ?? "", /INFO {2}\[test\] {7}first$/u);
    assert.match(lines[1] ?? "", /second$/u);
  });

  void test("drops messages below the configured level", () => {
    const dir = makeTempDir();
    const logger = createLogger("test", { dir, level: "warn" });
    logger.debug("d");
    logger.info("i");
    logger.warn("w");
    logger.error("e");
    const levels = readTodayLog(dir).map((line) => line.split(" ")[1]);
    assert.deepEqual(levels, ["WARN", "ERROR"]);
  });

  void test("uses LOG_DIR by default", () => {
    const logger = createLogger("test");
    logger.info("to the preload folder");
    const dir = process.env["LOG_DIR"] ?? "";
    assert.ok(existsSync(path.join(dir, `${formatLogDate(new Date())}.log`)));
  });
});

void describe("createLogger console output", () => {
  captureConsole();

  void test("sends warn and error to stderr, the rest to stdout", () => {
    const logger = createLogger("test", { dir: makeTempDir(), level: "debug" });
    logger.debug("d");
    logger.info("i");
    logger.warn("w");
    logger.error("e");
    assert.deepEqual(
      stdout.map((line) => line.trim().at(-1)),
      ["d", "i"],
    );
    assert.deepEqual(
      stderr.map((line) => line.trim().at(-1)),
      ["w", "e"],
    );
  });

  void test("does not throw when the file cannot be written and warns once", () => {
    const blocker = path.join(makeTempDir(), "not-a-folder");
    writeFileSync(blocker, "");
    const logger = createLogger("test", { dir: blocker });
    assert.doesNotThrow(() => {
      logger.info("one");
      logger.info("two");
    });
    const warnings = stderr.filter((line) => line.startsWith("Logger:"));
    assert.equal(warnings.length, 1);
    assert.equal(stdout.length, 2);
  });
});
