import { readFileSync } from "node:fs";

const DEFAULT_PORT = 4000;
const DEFAULT_API_SITE = "http://localhost";
const DEFAULT_API_PORT = 3000;

export interface AppAuthor {
  name: string;
  url?: string;
}

/** Returns the env variable, treating an empty value as unset. */
const readEnv = (name: string): string | undefined => {
  const value = process.env[name];
  return value === "" ? undefined : value;
};

function readPackageConfig(): object {
  const packageConfig: unknown = JSON.parse(readFileSync("package.json", "utf8"));
  if (typeof packageConfig !== "object" || packageConfig === null) {
    throw new TypeError("package.json must contain an object");
  }
  return packageConfig;
}

const readOptionalString = (source: object, key: string): string | undefined => {
  const value: unknown = key in source ? Reflect.get(source, key) : undefined;
  return typeof value === "string" && value !== "" ? value : undefined;
};

function readAppTitle(packageConfig: object): string {
  if ("displayName" in packageConfig && typeof packageConfig.displayName === "string") {
    return packageConfig.displayName;
  }
  if ("name" in packageConfig && typeof packageConfig.name === "string") {
    return packageConfig.name;
  }
  throw new TypeError("package.json must contain a name");
}

/** Reads `author` from package.json, either as an object or as a plain name string. */
function readAppAuthor(packageConfig: object): AppAuthor | undefined {
  const author: unknown = "author" in packageConfig ? packageConfig.author : undefined;
  if (typeof author === "string" && author !== "") {
    return { name: author };
  }
  if (typeof author !== "object" || author === null) {
    return undefined;
  }
  const name = readOptionalString(author, "name");
  if (!name) {
    return undefined;
  }
  const url = readOptionalString(author, "url");
  return url ? { name, url } : { name };
}

const packageConfig = readPackageConfig();

export const port = process.env["PORT"] ? Number(process.env["PORT"]) : DEFAULT_PORT;
export const clientSrc = process.env["CLIENT_SRC"] ?? "app";
const apiSite = (readEnv("API_SITE") ?? DEFAULT_API_SITE).replace(/\/+$/u, "");
const apiPort = readEnv("API_PORT") ?? String(DEFAULT_API_PORT);
/** `API_BASE_URL` wins when set; otherwise it is composed from `API_SITE` and `API_PORT`. */
export const apiBaseUrl = readEnv("API_BASE_URL") ?? `${apiSite}:${apiPort}`;
export const appTitle = readAppTitle(packageConfig);
export const appAuthor = readAppAuthor(packageConfig);

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
