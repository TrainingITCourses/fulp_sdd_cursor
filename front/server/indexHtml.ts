import type { Request, Response } from "express";
import { readFileSync } from "node:fs";
import path from "node:path";
import { apiBaseUrl, clientSrc, isDev, setNoCache } from "./config.js";

const indexPath = path.join(clientSrc, "index.html");
const runtimeConfig = `<script>globalThis.API_BASE_URL = ${JSON.stringify(apiBaseUrl).replaceAll("<", String.raw`\u003c`)};</script>`;
const indexHtml = injectRuntimeConfig(readFileSync(indexPath, "utf8"));

function injectRuntimeConfig(html: string): string {
  return html.replace("</head>", `  ${runtimeConfig}\n</head>`);
}

export function serveIndexHtml(_req: Request, res: Response): void {
  if (isDev) {
    setNoCache(res);
    res.type("html").send(injectRuntimeConfig(readFileSync(indexPath, "utf8")));
    return;
  }
  res.type("html").send(indexHtml);
}
