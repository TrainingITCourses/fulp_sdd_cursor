declare global {
  var API_BASE_URL: string;
}

const get = async <T>(path: string): Promise<T> => {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`GET ${url} failed: ${response.status} ${response.statusText}`);
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
    throw new Error(`POST ${url} failed: ${response.status} ${response.statusText}`);
  }
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return response.json() as Promise<T>;
};

export { get, post };
