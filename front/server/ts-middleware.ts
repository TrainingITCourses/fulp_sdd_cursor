import type { NextFunction, Request, Response } from "express";
import { existsSync, readFileSync, statSync } from "node:fs";
import * as nodeModule from "node:module";
import path from "node:path";
import { clientSrc, isDev, setNoCache } from "./config.js";

const cache = new Map<string, { mtimeMs: number; js: string }>();
const { stripTypeScriptTypes } = nodeModule as {
  stripTypeScriptTypes?: (code: string, options: { mode: "strip" }) => string;
};

const transpileTsToJs = (code: string): string => {
  // Bun does not expose node:module.stripTypeScriptTypes; use its native TS transpiler.
  if (typeof Bun !== "undefined" && typeof Bun.Transpiler === "function") {
    return new Bun.Transpiler({ loader: "ts" }).transformSync(code);
  }

  if (typeof stripTypeScriptTypes === "function") {
    return stripTypeScriptTypes(code, { mode: "strip" });
  }

  throw new Error("No TypeScript transpiler available for runtime.");
};

function getTranspiledJavaScript(tsPath: string): string {
  const js = transpileTsToJs(readFileSync(tsPath, "utf8"));
  const { mtimeMs } = statSync(tsPath);
  if (!isDev) {
    cache.set(tsPath, { js, mtimeMs });
  }
  return js;
}

function getCachedOrTranspile(tsPath: string, mtimeMs: number): string {
  if (isDev) {
    return getTranspiledJavaScript(tsPath);
  }
  const cached = cache.get(tsPath);
  if (cached && cached.mtimeMs === mtimeMs) {
    return cached.js;
  }
  return getTranspiledJavaScript(tsPath);
}

export const serveTsAsJs = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.path.endsWith(".js")) {
    next();
    return;
  }

  const tsPath = path.join(clientSrc, req.path.replace(/\.js$/u, ".ts"));
  if (!existsSync(tsPath)) {
    next();
    return;
  }
  const { mtimeMs } = statSync(tsPath);

  const js = getCachedOrTranspile(tsPath, mtimeMs);
  if (isDev) {
    setNoCache(res);
  }
  res.type("text/javascript").send(js);
};
