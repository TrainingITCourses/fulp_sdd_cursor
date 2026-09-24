import { createLogger } from "../core/create-logger.js";
import { isErrorBody } from "./is-error-body.js";

declare global {
  var API_BASE_URL: string;
}

const logger = createLogger("http");

/** Reads the `{ error }` body the back error handler always sends on a non-2xx response. */
const readErrorMessage = async (response: Response): Promise<string | undefined> => {
  try {
    const body: unknown = await response.clone().json();
    if (isErrorBody(body)) {
      return body.error;
    }
  } catch {
    // Non-JSON or empty body: fall back to the generic message below.
  }
  return undefined;
};

/** Logs and throws when the response is not 2xx; the thrown message is the API's `error` text when present. */
const ensureOk = async (method: string, url: string, response: Response): Promise<void> => {
  if (response.ok) {
    logger.debug(`${method} ${url} ${response.status}`);
    return;
  }
  const fallback = `${method} ${url} failed: ${response.status} ${response.statusText}`;
  const message = (await readErrorMessage(response)) ?? fallback;
  logger.error(message);
  throw new Error(message);
};

const get = async <T>(path: string): Promise<T> => {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url);
  await ensureOk("GET", url, response);
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return response.json() as Promise<T>;
};

const post = async <T>(path: string, body: unknown): Promise<T> => {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  await ensureOk("POST", url, response);
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return response.json() as Promise<T>;
};

export { get, post };
