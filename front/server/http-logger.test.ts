import express from "express";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { test } from "node:test";
import { logHttpRequests } from "./http-logger.js";
import type { Logger, LogLevel } from "./logger.js";

interface LoggedLine {
  level: LogLevel;
  message: string;
}

const createFakeLogger = (): { logger: Logger; lines: LoggedLine[] } => {
  const lines: LoggedLine[] = [];
  const record =
    (level: LogLevel) =>
    (message: string): void => {
      lines.push({ level, message });
    };
  return {
    lines,
    logger: {
      debug: record("debug"),
      info: record("info"),
      warn: record("warn"),
      error: record("error"),
    },
  };
};

const waitForFinish = (): Promise<void> =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

void test("logs one line per request with the level matching the status", async () => {
  const { logger, lines } = createFakeLogger();
  const app = express();
  app.use(logHttpRequests(logger));
  app.get("/ok", (_req, res) => {
    res.send("ok");
  });
  app.get("/boom", (_req, res) => {
    res.status(500).send("boom");
  });

  const server = app.listen(0);
  await new Promise((resolve) => {
    server.once("listening", resolve);
  });
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://localhost:${port}`;
  try {
    await (await fetch(`${baseUrl}/ok?x=1`)).text();
    await (await fetch(`${baseUrl}/missing`)).text();
    await (await fetch(`${baseUrl}/boom`)).text();
    await waitForFinish();
  } finally {
    server.close();
  }

  assert.deepEqual(
    lines.map((line) => line.level),
    ["info", "warn", "error"],
  );
  assert.match(lines[0]?.message ?? "", /^GET \/ok\?x=1 200 \d+ms$/u);
  assert.match(lines[1]?.message ?? "", /^GET \/missing 404 \d+ms$/u);
  assert.match(lines[2]?.message ?? "", /^GET \/boom 500 \d+ms$/u);
});
