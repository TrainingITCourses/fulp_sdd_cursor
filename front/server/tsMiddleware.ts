import type { NextFunction, Request, Response } from "express";
import { existsSync, readFileSync, statSync } from "node:fs";
import * as nodeModule from "node:module";
import path from "node:path";
import { clientSrc, isDev, setNoCache } from "./config.js";

const cache = new Map<string, { mtimeMs: number; js: string }>(),
  { stripTypeScriptTypes } = (nodeModule as {
    stripTypeScriptTypes?: (code: string, options: { mode: "strip" }) => string;
  });

function transpileTsToJs(code: string): string {
  // Bun does not expose node:module.stripTypeScriptTypes; use its native TS transpiler.
  if (typeof Bun !== "undefined" && typeof Bun.Transpiler === "function") {
    return new Bun.Transpiler({ loader: "ts" }).transformSync(code);
  }

  if (typeof stripTypeScriptTypes === "function") {
    return stripTypeScriptTypes(code, { mode: "strip" });
  }

  throw new Error("No TypeScript transpiler available for runtime.");
}

export function serveTsAsJs(req: Request, res: Response, next: NextFunction): void {
  if (!req.path.endsWith(".js")) {
    next();; return;
  }

  const tsPath = path.join(clientSrc, req.path.replace(/\.js$/u, ".ts"));
  // Return if not found
  if (!existsSync(tsPath)) {
    next();; return;
  }
  const { mtimeMs } = statSync(tsPath);

  if (!isDev) {
    const cached = cache.get(tsPath);
    if (cached && cached.mtimeMs === mtimeMs) {
      res.type("text/javascript").send(cached.js);
      return;
    }
  }

  const js = transpileTsToJs(readFileSync(tsPath, "utf8"));
  if (!isDev) {
    cache.set(tsPath, { js, mtimeMs });
  }
  if (isDev) {
    setNoCache(res);
  }
  res.type("text/javascript").send(js);
}
