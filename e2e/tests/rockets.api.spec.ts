import { type APIRequestContext, expect, test } from "@playwright/test";
import authFixture from "./fixtures/auth.json" with { type: "json" };
import { uniqueEmail } from "./fixtures/test-data.js";

const BACK_URL = process.env["E2E_BACK_URL"];

interface Rocket {
  id: number;
  name: string;
  range: string;
  capacity: number;
  disabled: boolean;
  createdAt: string;
}

const uniqueName = (label: string): string =>
  `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const sessionToken = async (request: APIRequestContext): Promise<string> => {
  const email = uniqueEmail("rocket");
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

test.describe("Rockets API", () => {
  test("AC-RKT-01 creates a rocket with capacity 9, enabled", async ({ request }) => {
    const token = await sessionToken(request);
    const name = uniqueName("create");
    const response = await request.post(`${BACK_URL}/api/rockets`, {
      data: { name: `  ${name}  `, range: "moon" },
      headers: authHeaders(token),
    });

    expect(response.status()).toBe(201);
    const rocket = (await response.json()) as Rocket;
    expect(rocket.name).toBe(name);
    expect(rocket.range).toBe("moon");
    expect(rocket.capacity).toBe(9);
    expect(rocket.disabled).toBe(false);
  });

  test("AC-RKT-02 rejects an empty name or a bad range with 400", async ({ request }) => {
    const token = await sessionToken(request);
    const emptyName = await request.post(`${BACK_URL}/api/rockets`, {
      data: { name: "  ", range: "earth" },
      headers: authHeaders(token),
    });
    const badRange = await request.post(`${BACK_URL}/api/rockets`, {
      data: { name: uniqueName("bad"), range: "pluto" },
      headers: authHeaders(token),
    });

    expect(emptyName.status()).toBe(400);
    expect(badRange.status()).toBe(400);
  });

  test("AC-RKT-03 rejects a capacity other than 9", async ({ request }) => {
    const token = await sessionToken(request);
    const created = await request.post(`${BACK_URL}/api/rockets`, {
      data: { name: uniqueName("cap"), range: "earth", capacity: 8 },
      headers: authHeaders(token),
    });
    expect(created.status()).toBe(400);
  });

  test("AC-RKT-04 rejects a duplicate name with 409", async ({ request }) => {
    const token = await sessionToken(request);
    const name = uniqueName("dup");
    const first = await request.post(`${BACK_URL}/api/rockets`, {
      data: { name, range: "earth" },
      headers: authHeaders(token),
    });
    expect(first.status()).toBe(201);
    const second = await request.post(`${BACK_URL}/api/rockets`, {
      data: { name: name.toUpperCase(), range: "mars" },
      headers: authHeaders(token),
    });
    expect(second.status()).toBe(409);
  });

  test("AC-RKT-05 lists every rocket, including disabled ones", async ({ request }) => {
    const token = await sessionToken(request);
    const headers = authHeaders(token);
    const kept = await request.post(`${BACK_URL}/api/rockets`, {
      data: { name: uniqueName("kept"), range: "earth" },
      headers,
    });
    const retired = await request.post(`${BACK_URL}/api/rockets`, {
      data: { name: uniqueName("retired"), range: "mars" },
      headers,
    });
    const keptBody = (await kept.json()) as Rocket;
    const retiredBody = (await retired.json()) as Rocket;
    const disabled = await request.post(`${BACK_URL}/api/rockets/${retiredBody.id}/disable`, {
      headers,
    });
    expect(disabled.status()).toBe(200);

    const list = await request.get(`${BACK_URL}/api/rockets`, { headers });
    expect(list.status()).toBe(200);
    const rockets = (await list.json()) as Rocket[];
    expect(rockets.map((rocket) => rocket.id)).toEqual(
      expect.arrayContaining([keptBody.id, retiredBody.id]),
    );
  });

  test("AC-RKT-06 returns one rocket and AC-RKT-07 returns 404 when missing", async ({
    request,
  }) => {
    const token = await sessionToken(request);
    const headers = authHeaders(token);
    const created = await request.post(`${BACK_URL}/api/rockets`, {
      data: { name: uniqueName("one"), range: "moon" },
      headers,
    });
    const rocket = (await created.json()) as Rocket;
    const found = await request.get(`${BACK_URL}/api/rockets/${rocket.id}`, { headers });
    expect(found.status()).toBe(200);
    const body = (await found.json()) as Rocket;
    expect(body.capacity).toBe(9);
    expect(body.disabled).toBe(false);

    const missing = await request.get(`${BACK_URL}/api/rockets/9999999`, { headers });
    expect(missing.status()).toBe(404);
  });

  test("AC-RKT-08 updates name or range and keeps capacity and disabled", async ({ request }) => {
    const token = await sessionToken(request);
    const headers = authHeaders(token);
    const created = await request.post(`${BACK_URL}/api/rockets`, {
      data: { name: uniqueName("edit"), range: "earth" },
      headers,
    });
    const rocket = (await created.json()) as Rocket;
    await request.post(`${BACK_URL}/api/rockets/${rocket.id}/disable`, { headers });
    const nextName = uniqueName("renamed");
    const updated = await request.patch(`${BACK_URL}/api/rockets/${rocket.id}`, {
      data: { name: nextName },
      headers,
    });
    expect(updated.status()).toBe(200);
    const body = (await updated.json()) as Rocket;
    expect(body.name).toBe(nextName);
    expect(body.range).toBe("earth");
    expect(body.capacity).toBe(9);
    expect(body.disabled).toBe(true);
  });

  test("AC-RKT-09 rejects an empty patch with 400", async ({ request }) => {
    const token = await sessionToken(request);
    const headers = authHeaders(token);
    const created = await request.post(`${BACK_URL}/api/rockets`, {
      data: { name: uniqueName("patch"), range: "moon" },
      headers,
    });
    const rocket = (await created.json()) as Rocket;
    const patched = await request.patch(`${BACK_URL}/api/rockets/${rocket.id}`, {
      data: {},
      headers,
    });
    expect(patched.status()).toBe(400);
  });

  test("AC-RKT-10 disables a rocket and AC-RKT-11 rejects a second disable", async ({
    request,
  }) => {
    const token = await sessionToken(request);
    const headers = authHeaders(token);
    const created = await request.post(`${BACK_URL}/api/rockets`, {
      data: { name: uniqueName("off"), range: "mars" },
      headers,
    });
    const rocket = (await created.json()) as Rocket;
    const disabled = await request.post(`${BACK_URL}/api/rockets/${rocket.id}/disable`, {
      headers,
    });
    expect(disabled.status()).toBe(200);
    expect(((await disabled.json()) as Rocket).disabled).toBe(true);
    const again = await request.post(`${BACK_URL}/api/rockets/${rocket.id}/disable`, { headers });
    expect(again.status()).toBe(409);
    const stillThere = await request.get(`${BACK_URL}/api/rockets/${rocket.id}`, { headers });
    expect(stillThere.status()).toBe(200);
  });

  test("AC-RKT-12 rejects requests without a session with 401", async ({ request }) => {
    const list = await request.get(`${BACK_URL}/api/rockets`);
    const created = await request.post(`${BACK_URL}/api/rockets`, {
      data: { name: uniqueName("anon"), range: "earth" },
    });
    expect(list.status()).toBe(401);
    expect(created.status()).toBe(401);
  });

  test("AC-RKT-18 does not expose delete or re-enable", async ({ request }) => {
    const token = await sessionToken(request);
    const headers = authHeaders(token);
    const created = await request.post(`${BACK_URL}/api/rockets`, {
      data: { name: uniqueName("keep"), range: "earth" },
      headers,
    });
    const rocket = (await created.json()) as Rocket;
    const removed = await request.delete(`${BACK_URL}/api/rockets/${rocket.id}`, { headers });
    const enabled = await request.post(`${BACK_URL}/api/rockets/${rocket.id}/enable`, { headers });
    expect(removed.status()).toBe(404);
    expect(enabled.status()).toBe(404);
  });
});
