declare global {
  var API_BASE_URL: string;
}

const fallbackMessage = (method: string, url: string, response: Response): string =>
  `${method} ${url} failed: ${response.status} ${response.statusText}`;

const readApiError = async (response: Response, fallback: string): Promise<string> => {
  try {
    const payload: unknown = await response.json();
    if (typeof payload === "object" && payload !== null && "error" in payload) {
      const message = payload["error"];
      if (typeof message === "string" && message.length > 0) {
        return message;
      }
    }
  } catch {
    return fallback;
  }
  return fallback;
};

const get = async <T>(path: string): Promise<T> => {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(await readApiError(response, fallbackMessage("GET", url, response)));
  }
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
  if (!response.ok) {
    throw new Error(await readApiError(response, fallbackMessage("POST", url, response)));
  }
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return response.json() as Promise<T>;
};

export { get, post };
