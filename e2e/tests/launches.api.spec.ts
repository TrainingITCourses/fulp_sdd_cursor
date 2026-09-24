import { type APIRequestContext, expect, test } from "@playwright/test";
import authFixture from "./fixtures/auth.json" with { type: "json" };
import { uniqueEmail } from "./fixtures/test-data.js";

const BACK_URL = process.env["E2E_BACK_URL"];

interface Rocket {
  id: number;
  name: string;
  disabled: boolean;
}

interface Launch {
  id: number;
  rocketId: number;
  scheduledAt: string;
  pricePerPassenger: number;
  status: string;
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
