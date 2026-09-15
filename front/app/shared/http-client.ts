declare global {
  var API_BASE_URL: string;
}

const {API_BASE_URL} = globalThis;

export async function get<T>(path: string): Promise<T> {
  const url = `${API_BASE_URL}${path}`,
   response = await fetch(url);
  if (!response.ok) {
    throw new Error(`GET ${url} failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  const url = `${API_BASE_URL}${path}`,
   response = await fetch(url, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`POST ${url} failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
