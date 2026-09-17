import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { register } from "./register.repository.js";

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

void test("register posts the form payload and returns the API result", async () => {
  const result = {
    email: "ada@astro.test",
    id: 1,
    name: "Ada",
    token: "tok-1",
  };
  const captured: { body?: string; url?: string } = {};
  stubFetch(async (url, init) => {
    captured.url = url;
    if (typeof init?.body === "string") {
      captured.body = init.body;
    }
    return new Response(JSON.stringify(result), { status: 201 });
  });

  const payload = await register({
    email: "ada@astro.test",
    name: "Ada",
    password: "secret-pass",
  });

  assert.equal(captured.url, `${API_BASE_URL}/api/register`);
  assert.equal(
    captured.body,
    JSON.stringify({ email: "ada@astro.test", name: "Ada", password: "secret-pass" }),
  );
  assert.deepEqual(payload, result);
});

void test("register surfaces the API error message", async () => {
  stubFetch(
    async () =>
      new Response(JSON.stringify({ error: "Email already registered" }), { status: 409 }),
  );

  await assert.rejects(
    () => register({ email: "ada@astro.test", name: "Ada", password: "secret-pass" }),
    { message: "Email already registered" },
  );
});
