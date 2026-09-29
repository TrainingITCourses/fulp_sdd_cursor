import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import { authStore } from "../store/auth.store.js";
import { createBooking, listBookings } from "./bookings.repository.js";

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

const booking = {
  createdAt: "2026-09-29T17:00:00.000Z",
  email: "grace@example.com",
  id: 3,
  launchId: 4,
  name: "Grace",
  phone: "+34 600 000 000",
};

interface Call {
  url: string;
  method: string;
  authorization: string | null;
  body: string;
}

const stubFetch = (status: number, payload: unknown): Call[] => {
  const calls: Call[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    calls.push({
      authorization: headers.get("Authorization"),
      body: typeof init?.body === "string" ? init.body : "",
      method: init?.method ?? "GET",
      url,
    });
    return new Response(JSON.stringify(payload), { status });
  }) as unknown as typeof fetch;
  return calls;
};

afterEach(() => {
  authStore.set(undefined);
});

void describe("bookings repository", () => {
  void test("lists the bookings of a launch with the session bearer token", async () => {
    authStore.set(session);
    globalThis.API_BASE_URL = "http://api.test";
    const calls = stubFetch(200, { bookings: [booking], capacity: 9, free: 8, taken: 1 });

    const seats = await listBookings("4");

    assert.equal(seats.free, 8);
    assert.equal(seats.bookings[0]?.name, "Grace");
    assert.equal(calls[0]?.url, "http://api.test/api/launches/4/bookings");
    assert.equal(calls[0]?.method, "GET");
    assert.equal(calls[0]?.authorization, "Bearer session-token");
  });

  void test("creates a booking with only name, email and phone", async () => {
    authStore.set(session);
    globalThis.API_BASE_URL = "http://api.test";
    const calls = stubFetch(201, booking);

    const created = await createBooking("4", {
      email: "grace@example.com",
      name: "Grace",
      phone: "+34 600 000 000",
    });

    assert.equal(created.id, 3);
    assert.equal(calls[0]?.url, "http://api.test/api/launches/4/bookings");
    assert.equal(calls[0]?.method, "POST");
    assert.equal(calls[0]?.authorization, "Bearer session-token");
    assert.deepEqual(Object.keys(JSON.parse(calls[0]?.body ?? "{}") as object).toSorted(), [
      "email",
      "name",
      "phone",
    ]);
  });

  void test("rejects with the API error message when the launch is full", async () => {
    authStore.set(session);
    globalThis.API_BASE_URL = "http://api.test";
    stubFetch(409, { error: "Launch has no free seats" });

    await assert.rejects(
      createBooking("4", { email: "a@b.c", name: "A", phone: "1" }),
      /Launch has no free seats/,
    );
  });
});
