import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import { authStore } from "../store/auth.store.js";
import { createLaunch, listLaunches } from "./launches.repository.js";

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

const launch = {
  createdAt: "2026-09-24T00:00:00.000Z",
  id: 4,
  pricePerPassenger: 1200,
  rocketId: 7,
  scheduledAt: "2026-12-01T10:00:00.000Z",
  status: "planned" as const,
};

afterEach(() => {
  authStore.set(undefined);
});

void describe("launches repository", () => {
  void test("lists launches with the session bearer token", async () => {
    authStore.set(session);
    globalThis.API_BASE_URL = "http://api.test";
    const calls: { url: string; authorization: string | null }[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      calls.push({ authorization: headers.get("Authorization"), url });
      return new Response(JSON.stringify([launch]), { status: 200 });
    }) as unknown as typeof fetch;

    const launches = await listLaunches();

    assert.equal(launches[0]?.status, "planned");
    assert.equal(calls[0]?.url, "http://api.test/api/launches");
    assert.equal(calls[0]?.authorization, "Bearer session-token");
  });

  void test("creates a planned launch and returns it", async () => {
    authStore.set(session);
    globalThis.API_BASE_URL = "http://api.test";
    let body = "";
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      body = typeof init?.body === "string" ? init.body : "";
      return new Response(JSON.stringify(launch), { status: 201 });
    }) as unknown as typeof fetch;

    const created = await createLaunch({
      pricePerPassenger: 1200,
      rocketId: 7,
      scheduledAt: "2026-12-01T10:00:00.000Z",
    });

    assert.equal(created.id, 4);
    assert.equal(created.status, "planned");
    assert.equal(body.includes('"status"'), false);
  });
});
