const DEFAULT_PORT = 4000;

export const port = process.env["PORT"] ? Number(process.env["PORT"]) : DEFAULT_PORT;
export const clientSrc = process.env["CLIENT_SRC"] ?? "app";
export const apiBaseUrl = process.env["API_BASE_URL"] ?? "";

/** Production when started via `start` script or NODE_ENV=production. */
export const isProduction =
  process.env["npm_lifecycle_event"] === "start" || process.env.NODE_ENV === "production";

export const isDev = !isProduction;

export function setNoCache(res: { setHeader(name: string, value: string): void }): void {
  res.setHeader("Cache-Control", "no-store");
}

export const staticOptions = {
  index: false as const,
  ...(isDev
    ? {
      etag: false,
      lastModified: false,
      maxAge: 0,
      setHeaders(res: { setHeader(name: string, value: string): void }) {
        setNoCache(res);
      },
    }
    : {}),
};
