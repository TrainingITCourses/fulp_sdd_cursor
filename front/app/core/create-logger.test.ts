import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import { LOG_LEVEL_KEY, createLogger, formatLogPrefix, parseLogLevel } from "./create-logger.js";

const DATE = new Date(2026, 0, 5, 9, 4, 7, 81);

interface ConsoleCall {
  method: string;
  args: unknown[];
}

const calls: ConsoleCall[] = [];
const originalConsole = {
  debug: console.debug,
  error: console.error,
  info: console.info,
  warn: console.warn,
};

beforeEach(() => {
  calls.length = 0;
  for (const method of ["debug", "info", "warn", "error"] as const) {
    console[method] = (...args: unknown[]) => {
      calls.push({ args, method });
    };
  }
});

afterEach(() => {
  Object.assign(console, originalConsole);
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  globalThis.localStorage = undefined as unknown as Storage;
});

const stubLocalStorage = (entries: Record<string, string>): void => {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  globalThis.localStorage = {
    // oxlint-disable-next-line unicorn/no-null
    getItem: (key: string) => entries[key] ?? null,
  } as Storage;
};

void describe("formatLogPrefix", () => {
  void test("pads time, level and source into fixed columns", () => {
    assert.equal(formatLogPrefix(DATE, "info", "home"), "09:04:07.081 INFO  [home]      ");
  });

  void test("trims the source and truncates it to 10 characters", () => {
    assert.equal(
      formatLogPrefix(DATE, "error", "  health-repository "),
      "09:04:07.081 ERROR [health-rep]",
    );
  });
});

void describe("parseLogLevel", () => {
  void test("accepts known levels and defaults to info", () => {
    assert.equal(parseLogLevel("warn"), "warn");
    assert.equal(parseLogLevel(" DEBUG "), "debug");
    assert.equal(parseLogLevel(null), "info");
    assert.equal(parseLogLevel("verbose"), "info");
  });
});

void describe("createLogger", () => {
  void test("writes to the console method of each level with prefix, message and details", () => {
    const logger = createLogger("page", { level: "debug" });
    const detail = { id: 1 };
    logger.debug("d");
    logger.info("i");
    logger.warn("w");
    logger.error("e", detail);

    assert.deepEqual(
      calls.map(({ method, args }) => [method, args[1]]),
      [
        ["debug", "d"],
        ["info", "i"],
        ["warn", "w"],
        ["error", "e"],
      ],
    );
    assert.match(String(calls[0]?.args[0]), /DEBUG \[page\]/u);
    assert.equal(calls[3]?.args[2], detail);
  });

  void test("drops messages below the configured level", () => {
    const logger = createLogger("page", { level: "warn" });
    logger.debug("d");
    logger.info("i");
    logger.warn("w");
    assert.deepEqual(
      calls.map(({ method }) => method),
      ["warn"],
    );
  });

  void test("reads the level from localStorage when not given", () => {
    stubLocalStorage({ [LOG_LEVEL_KEY]: "debug" });
    createLogger("page").debug("visible");
    assert.equal(calls.length, 1);
  });

  void test("defaults to info when localStorage is unavailable", () => {
    const logger = createLogger("page");
    logger.debug("hidden");
    logger.info("visible");
    assert.deepEqual(
      calls.map(({ method }) => method),
      ["info"],
    );
  });
});
