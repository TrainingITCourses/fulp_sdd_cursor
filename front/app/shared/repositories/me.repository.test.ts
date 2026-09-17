import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { getMe } from "./me.repository.js";

const API_BASE_URL = "http://api.test";
const originalFetch = globalThis.fetch;

beforeEach(() => {
  globalThis.API_BASE_URL = API_BASE_URL;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const requestUrl = (input: RequestInfo | URL): string => {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  if (input instanceof Request) return input.url;
  return "";
};

const stubFetch = (impl: (url: string, init?: RequestInit) => Promise<Response>): void => {
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) =>
    impl(requestUrl(input), init)) as typeof fetch;
};

void test("getMe sends the bearer token and returns the profile", async () => {
  const result = { email: "ada@astro.test", id: 1, name: "Ada" };
  const captured: { headers?: HeadersInit; url?: string } = {};
  stubFetch(async (url, init) => {
    captured.url = url;
    if (init?.headers) {
      captured.headers = init.headers;
    }
    return new Response(JSON.stringify(result), { status: 200 });
  });

  const payload = await getMe("tok-1");

  assert.equal(captured.url, `${API_BASE_URL}/api/me`);
  assert.deepEqual(captured.headers, { Authorization: "Bearer tok-1" });
  assert.deepEqual(payload, result);
});

void test("getMe surfaces an invalid-token error", async () => {
  stubFetch(
    async () =>
      new Response(JSON.stringify({ error: "Invalid or missing token" }), { status: 401 }),
  );

  await assert.rejects(() => getMe("bad-token"), { message: "Invalid or missing token" });
});
