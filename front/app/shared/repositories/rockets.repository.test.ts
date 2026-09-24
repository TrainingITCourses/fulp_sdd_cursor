import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import { authStore } from "../store/auth.store.js";
import { createRocket, listRockets } from "./rockets.repository.js";

const session = {
  token: "session-token",
  user: {
    createdAt: "2026-09-24T00:00:00.000Z",
    email: "ada@example.com",
    id: 1,
    name: "Ada",
    role: "user" as const,
  },
};

const rocket = {
  capacity: 9,
  createdAt: "2026-09-24T00:00:00.000Z",
  disabled: false,
  id: 7,
  name: "Falcon",
  range: "moon" as const,
};

afterEach(() => {
  authStore.set(undefined);
});

void describe("rockets repository", () => {
  void test("lists rockets with the session bearer token", async () => {
    authStore.set(session);
    globalThis.API_BASE_URL = "http://api.test";
    const calls: { url: string; authorization: string | null }[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      calls.push({ authorization: headers.get("Authorization"), url });
      return new Response(JSON.stringify([rocket]), { status: 200 });
    }) as unknown as typeof fetch;

    const rockets = await listRockets();

    assert.equal(rockets[0]?.name, "Falcon");
    assert.equal(calls[0]?.url, "http://api.test/api/rockets");
    assert.equal(calls[0]?.authorization, "Bearer session-token");
  });

  void test("creates a rocket and returns it", async () => {
    authStore.set(session);
    globalThis.API_BASE_URL = "http://api.test";
    globalThis.fetch = (async () =>
      new Response(JSON.stringify(rocket), { status: 201 })) as unknown as typeof fetch;

    const created = await createRocket({ name: "Falcon", range: "moon" });

    assert.equal(created.id, 7);
    assert.equal(created.capacity, 9);
  });
});
