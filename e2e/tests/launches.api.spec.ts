import { type APIRequestContext, expect, test } from "@playwright/test";
import authFixture from "./fixtures/auth.json" with { type: "json" };
import { uniqueEmail } from "./fixtures/test-data.js";
import { setLaunchStatus } from "./support/set-launch-status.js";

const BACK_URL = process.env["E2E_BACK_URL"];

interface Rocket {
  id: number;
  name: string;
  disabled: boolean;
}

interface Cancellation {
  causeType: string;
  causeText: string;
  cancelledAt: string;
  cancelledBy: { id: number; name: string };
}

interface Launch {
  id: number;
  rocketId: number;
  scheduledAt: string;
  pricePerPassenger: number;
  status: string;
  cancellation: Cancellation | null;
}

const uniqueName = (label: string): string =>
  `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const futureIso = (offsetMs = 86_400_000): string => new Date(Date.now() + offsetMs).toISOString();

const sessionToken = async (request: APIRequestContext): Promise<string> => {
  const email = uniqueEmail("launch");
  const registered = await request.post(`${BACK_URL}/api/auth/register`, {
    data: { email, name: authFixture.users.ada.name, password: authFixture.users.ada.password },
  });
  expect(registered.status()).toBe(201);
  const loggedIn = await request.post(`${BACK_URL}/api/auth/login`, {
    data: { email, password: authFixture.users.ada.password },
  });
  expect(loggedIn.status()).toBe(200);
  const session = (await loggedIn.json()) as { token: string };
  return session.token;
};

const authHeaders = (token: string): { Authorization: string } => ({
  Authorization: `Bearer ${token}`,
});

const createRocket = async (
  request: APIRequestContext,
  headers: { Authorization: string },
  label: string,
): Promise<Rocket> => {
  const created = await request.post(`${BACK_URL}/api/rockets`, {
    data: { name: uniqueName(label), range: "earth" },
    headers,
  });
  expect(created.status()).toBe(201);
  return (await created.json()) as Rocket;
};

test.describe("Launches API", () => {
  test("AC-LCH-01 creates a planned launch and AC-LCH-08 and AC-LCH-09 return it", async ({
    request,
  }) => {
    const token = await sessionToken(request);
    const headers = authHeaders(token);
    const rocket = await createRocket(request, headers, "carrier");
    const later = futureIso(200_000_000);
    const sooner = futureIso(100_000_000);
    const first = await request.post(`${BACK_URL}/api/launches`, {
      data: { rocketId: rocket.id, scheduledAt: later, pricePerPassenger: 2500 },
      headers,
    });
    expect(first.status()).toBe(201);
    const created = (await first.json()) as Launch;
    expect(created.rocketId).toBe(rocket.id);
    expect(created.scheduledAt).toBe(later);
    expect(created.pricePerPassenger).toBe(2500);
    expect(created.status).toBe("planned");

    const second = await request.post(`${BACK_URL}/api/launches`, {
      data: { rocketId: rocket.id, scheduledAt: sooner, pricePerPassenger: 1800 },
      headers,
    });
    expect(second.status()).toBe(201);

    const list = await request.get(`${BACK_URL}/api/launches`, { headers });
    expect(list.status()).toBe(200);
    const launches = (await list.json()) as Launch[];
    const ours = launches.filter((launch) => launch.rocketId === rocket.id);
    expect(ours.map((launch) => launch.scheduledAt)).toEqual([sooner, later]);
    expect(ours.every((launch) => launch.status === "planned")).toBe(true);

    const found = await request.get(`${BACK_URL}/api/launches/${created.id}`, { headers });
    expect(found.status()).toBe(200);
    const detail = (await found.json()) as Launch;
    expect(detail.rocketId).toBe(rocket.id);
    expect(detail.scheduledAt).toBe(later);
    expect(detail.pricePerPassenger).toBe(2500);
    expect(detail.status).toBe("planned");
  });

  test("AC-LCH-03 rejects a disabled rocket with 409", async ({ request }) => {
    const token = await sessionToken(request);
    const headers = authHeaders(token);
    const rocket = await createRocket(request, headers, "retired");
    const disabled = await request.post(`${BACK_URL}/api/rockets/${rocket.id}/disable`, {
      headers,
    });
    expect(disabled.status()).toBe(200);

    const created = await request.post(`${BACK_URL}/api/launches`, {
      data: { rocketId: rocket.id, scheduledAt: futureIso(), pricePerPassenger: 900 },
      headers,
    });
    expect(created.status()).toBe(409);
  });

  test("AC-LCH-04 rejects a date that is not in the future with 400", async ({ request }) => {
    const token = await sessionToken(request);
    const headers = authHeaders(token);
    const rocket = await createRocket(request, headers, "past");
    const created = await request.post(`${BACK_URL}/api/launches`, {
      data: {
        rocketId: rocket.id,
        scheduledAt: new Date(Date.now() - 86_400_000).toISOString(),
        pricePerPassenger: 900,
      },
      headers,
    });
    expect(created.status()).toBe(400);
  });

  test("AC-LCH-07 rejects create and read without a session with 401", async ({ request }) => {
    const list = await request.get(`${BACK_URL}/api/launches`);
    const created = await request.post(`${BACK_URL}/api/launches`, {
      data: { rocketId: 1, scheduledAt: futureIso(), pricePerPassenger: 900 },
    });
    const detail = await request.get(`${BACK_URL}/api/launches/1`);
    expect(list.status()).toBe(401);
    expect(created.status()).toBe(401);
    expect(detail.status()).toBe(401);
  });
});

const planLaunch = async (
  request: APIRequestContext,
  headers: { Authorization: string },
): Promise<Launch> => {
  const rocket = await createRocket(request, headers, "cancel");
  const created = await request.post(`${BACK_URL}/api/launches`, {
    data: { rocketId: rocket.id, scheduledAt: futureIso(), pricePerPassenger: 2100 },
    headers,
  });
  expect(created.status()).toBe(201);
  return (await created.json()) as Launch;
};

test.describe("Cancel launch API", () => {
  test("AC-CNL-01 and AC-CNL-07 cancel a planned or confirmed launch and return the record", async ({
    request,
  }) => {
    const token = await sessionToken(request);
    const headers = authHeaders(token);
    const planned = await planLaunch(request, headers);
    const confirmed = await planLaunch(request, headers);
    setLaunchStatus(confirmed.id, "confirmed");

    const first = await request.post(`${BACK_URL}/api/launches/${planned.id}/cancel`, {
      data: { causeType: "technical", causeText: "  Valve leak  " },
      headers,
    });
    expect(first.status()).toBe(200);
    const cancelled = (await first.json()) as Launch;
    expect(cancelled.status).toBe("cancelled");
    expect(cancelled.cancellation?.causeType).toBe("technical");
    expect(cancelled.cancellation?.causeText).toBe("Valve leak");
    expect(cancelled.cancellation?.cancelledAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(cancelled.cancellation?.cancelledBy.name).toBe(authFixture.users.ada.name);

    const second = await request.post(`${BACK_URL}/api/launches/${confirmed.id}/cancel`, {
      data: { causeType: "economic", causeText: "Budget cut" },
      headers,
    });
    expect(second.status()).toBe(200);
    const also = (await second.json()) as Launch;
    expect(also.cancellation?.causeType).toBe("economic");

    const found = await request.get(`${BACK_URL}/api/launches/${planned.id}`, { headers });
    expect(found.status()).toBe(200);
    expect((await found.json()) as Launch).toMatchObject({
      cancellation: cancelled.cancellation,
      status: "cancelled",
    });
  });

  test("AC-CNL-02 and AC-CNL-03 reject a bad cause or an actor field with 400", async ({
    request,
  }) => {
    const token = await sessionToken(request);
    const headers = authHeaders(token);
    const launch = await planLaunch(request, headers);
    const badType = await request.post(`${BACK_URL}/api/launches/${launch.id}/cancel`, {
      data: { causeType: "weather", causeText: "Storm" },
      headers,
    });
    const blank = await request.post(`${BACK_URL}/api/launches/${launch.id}/cancel`, {
      data: { causeType: "meteorological", causeText: "   " },
      headers,
    });
    const actor = await request.post(`${BACK_URL}/api/launches/${launch.id}/cancel`, {
      data: {
        causeType: "meteorological",
        causeText: "Storm",
        cancelledAt: "2026-09-29T16:00:00.000Z",
      },
      headers,
    });
    expect(badType.status()).toBe(400);
    expect(blank.status()).toBe(400);
    expect(actor.status()).toBe(400);
    const still = await request.get(`${BACK_URL}/api/launches/${launch.id}`, { headers });
    const body = (await still.json()) as Launch;
    expect(body.status).toBe("planned");
    expect(body.cancellation).toBeNull();
  });

  test("AC-CNL-04 and AC-CNL-14 reject a successful or already cancelled launch with 409", async ({
    request,
  }) => {
    const token = await sessionToken(request);
    const headers = authHeaders(token);
    const successful = await planLaunch(request, headers);
    setLaunchStatus(successful.id, "successful");
    const blocked = await request.post(`${BACK_URL}/api/launches/${successful.id}/cancel`, {
      data: { causeType: "technical", causeText: "Too late" },
      headers,
    });
    expect(blocked.status()).toBe(409);

    const launch = await planLaunch(request, headers);
    const first = await request.post(`${BACK_URL}/api/launches/${launch.id}/cancel`, {
      data: { causeType: "meteorological", causeText: "Storm" },
      headers,
    });
    expect(first.status()).toBe(200);
    const recorded = ((await first.json()) as Launch).cancellation;
    const again = await request.post(`${BACK_URL}/api/launches/${launch.id}/cancel`, {
      data: { causeType: "economic", causeText: "Changed" },
      headers,
    });
    expect(again.status()).toBe(409);
    const found = await request.get(`${BACK_URL}/api/launches/${launch.id}`, { headers });
    expect(((await found.json()) as Launch).cancellation).toEqual(recorded);
  });

  test("AC-CNL-05 responds 404 for an unknown launch", async ({ request }) => {
    const token = await sessionToken(request);
    const missing = await request.post(`${BACK_URL}/api/launches/999999/cancel`, {
      data: { causeType: "technical", causeText: "Gone" },
      headers: authHeaders(token),
    });
    expect(missing.status()).toBe(404);
  });

  test("AC-CNL-06 rejects a cancel without a session with 401", async ({ request }) => {
    const cancelled = await request.post(`${BACK_URL}/api/launches/1/cancel`, {
      data: { causeType: "technical", causeText: "Gone" },
    });
    expect(cancelled.status()).toBe(401);
  });

  test("AC-CNL-08 returns an empty cancellation while the launch is not cancelled", async ({
    request,
  }) => {
    const token = await sessionToken(request);
    const headers = authHeaders(token);
    const launch = await planLaunch(request, headers);
    const found = await request.get(`${BACK_URL}/api/launches/${launch.id}`, { headers });
    expect(((await found.json()) as Launch).cancellation).toBeNull();
  });
});

interface Booking {
  id: number;
  launchId: number;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

interface LaunchBookings {
  capacity: number;
  taken: number;
  free: number;
  bookings: Booking[];
}

const passenger = (label: string): { name: string; email: string; phone: string } => ({
  email: `${label}@example.com`,
  name: `Passenger ${label}`,
  phone: "+34 600 000 000",
});

const bookingsUrl = (launchId: number | string): string =>
  `${BACK_URL}/api/launches/${launchId}/bookings`;

const readBookings = async (
  request: APIRequestContext,
  headers: { Authorization: string },
  launchId: number,
): Promise<LaunchBookings> => {
  const listed = await request.get(bookingsUrl(launchId), { headers });
  expect(listed.status()).toBe(200);
  return (await listed.json()) as LaunchBookings;
};

test.describe("Bookings API", () => {
  test("AC-BKG-01 and AC-BKG-08 book one seat and list the passenger with free seats", async ({
    request,
  }) => {
    const headers = authHeaders(await sessionToken(request));
    const launch = await planLaunch(request, headers);
    const empty = await readBookings(request, headers, launch.id);
    expect(empty).toEqual({ bookings: [], capacity: 9, free: 9, taken: 0 });

    const first = await request.post(bookingsUrl(launch.id), {
      data: { email: " ada@example.com ", name: "  Ada  ", phone: " 600 111 222 " },
      headers,
    });
    expect(first.status()).toBe(201);
    const booked = (await first.json()) as Booking;
    expect(booked).toMatchObject({
      email: "ada@example.com",
      launchId: launch.id,
      name: "Ada",
      phone: "600 111 222",
    });
    expect(booked.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/);
    const second = await request.post(bookingsUrl(launch.id), {
      data: passenger("grace"),
      headers,
    });
    expect(second.status()).toBe(201);

    const seats = await readBookings(request, headers, launch.id);
    expect(seats.capacity).toBe(9);
    expect(seats.taken).toBe(2);
    expect(seats.free).toBe(7);
    expect(seats.bookings.map((booking) => booking.name)).toEqual(["Ada", "Passenger grace"]);
    expect(seats.bookings[0]).toEqual(booked);
  });

  test("AC-BKG-02 rejects an empty name, email or phone and an email without @ with 400", async ({
    request,
  }) => {
    const headers = authHeaders(await sessionToken(request));
    const launch = await planLaunch(request, headers);
    const valid = passenger("blank");
    for (const data of [
      { ...valid, name: "   " },
      { ...valid, email: "  " },
      { ...valid, phone: "" },
      { ...valid, email: "blank.example.com" },
    ]) {
      const rejected = await request.post(bookingsUrl(launch.id), { data, headers });
      expect(rejected.status()).toBe(400);
    }
    expect((await readBookings(request, headers, launch.id)).taken).toBe(0);
  });

  test("AC-BKG-03 rejects an id, a time, a user or a launch id in the body with 400", async ({
    request,
  }) => {
    const headers = authHeaders(await sessionToken(request));
    const launch = await planLaunch(request, headers);
    const valid = passenger("extra");
    for (const extra of [
      { id: 1 },
      { createdAt: "2026-09-29T16:00:00.000Z" },
      { userId: 1 },
      { launchId: launch.id },
    ]) {
      const rejected = await request.post(bookingsUrl(launch.id), {
        data: { ...valid, ...extra },
        headers,
      });
      expect(rejected.status()).toBe(400);
    }
    expect((await readBookings(request, headers, launch.id)).taken).toBe(0);
  });

  test("AC-BKG-04 responds 404 for an unknown launch", async ({ request }) => {
    const headers = authHeaders(await sessionToken(request));
    const created = await request.post(bookingsUrl(999_999), {
      data: passenger("missing"),
      headers,
    });
    const listed = await request.get(bookingsUrl(999_999), { headers });
    expect(created.status()).toBe(404);
    expect(listed.status()).toBe(404);
  });

  test("AC-BKG-05 rejects a launch that is not planned with 409", async ({ request }) => {
    const headers = authHeaders(await sessionToken(request));
    const confirmed = await planLaunch(request, headers);
    setLaunchStatus(confirmed.id, "confirmed");
    const cancelled = await planLaunch(request, headers);
    const cancel = await request.post(`${BACK_URL}/api/launches/${cancelled.id}/cancel`, {
      data: { causeType: "technical", causeText: "Valve leak" },
      headers,
    });
    expect(cancel.status()).toBe(200);

    for (const launch of [confirmed, cancelled]) {
      const rejected = await request.post(bookingsUrl(launch.id), {
        data: passenger("closed"),
        headers,
      });
      expect(rejected.status()).toBe(409);
      expect((await readBookings(request, headers, launch.id)).taken).toBe(0);
    }
  });

  test("AC-BKG-06 rejects booking number 10 with 409 and keeps 9 seats taken", async ({
    request,
  }) => {
    const headers = authHeaders(await sessionToken(request));
    const launch = await planLaunch(request, headers);
    for (let seat = 1; seat <= 9; seat += 1) {
      const booked = await request.post(bookingsUrl(launch.id), {
        data: passenger(`seat${seat}`),
        headers,
      });
      expect(booked.status()).toBe(201);
    }

    const tenth = await request.post(bookingsUrl(launch.id), {
      data: passenger("seat10"),
      headers,
    });
    expect(tenth.status()).toBe(409);
    const seats = await readBookings(request, headers, launch.id);
    expect(seats.taken).toBe(9);
    expect(seats.free).toBe(0);
  });

  test("AC-BKG-07 rejects booking and listing without a session with 401", async ({ request }) => {
    const headers = authHeaders(await sessionToken(request));
    const launch = await planLaunch(request, headers);
    const created = await request.post(bookingsUrl(launch.id), { data: passenger("anon") });
    const listed = await request.get(bookingsUrl(launch.id));
    const forged = await request.get(bookingsUrl(launch.id), {
      headers: { Authorization: "Bearer not-a-session" },
    });
    expect(created.status()).toBe(401);
    expect(listed.status()).toBe(401);
    expect(forged.status()).toBe(401);
    expect((await readBookings(request, headers, launch.id)).taken).toBe(0);
  });
});
