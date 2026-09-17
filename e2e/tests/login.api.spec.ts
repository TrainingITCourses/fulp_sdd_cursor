import { expect, test } from "@playwright/test";

const DEFAULT_BACK_PORT = 3000;
const backPort = process.env["BACK_PORT"] ?? DEFAULT_BACK_PORT;
const API_URL = `http://localhost:${backPort}`;

const uniqueEmail = (): string => `e2e-login-${Date.now()}-${Math.random()}@astro.test`;

test.describe("Login API", () => {
  test("should return id, email, name and token for valid credentials", async ({ request }) => {
    const email = uniqueEmail();
    const created = await request.post(`${API_URL}/api/register`, {
      data: { email, name: "Ada", password: "secret-pass" },
    });
    expect(created.status()).toBe(201);

    const response = await request.post(`${API_URL}/api/login`, {
      data: { email, password: "secret-pass" },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("email", email);
    expect(data).toHaveProperty("name", "Ada");
    expect(data).toHaveProperty("token");
    expect(typeof data.token).toBe("string");
    expect(data).not.toHaveProperty("password");
    expect(data).not.toHaveProperty("passwordHash");
    expect(data).not.toHaveProperty("password_hash");
  });

  test("should reject credentials that do not match a user", async ({ request }) => {
    const email = uniqueEmail();
    const created = await request.post(`${API_URL}/api/register`, {
      data: { email, name: "Ada", password: "secret-pass" },
    });
    expect(created.status()).toBe(201);

    const response = await request.post(`${API_URL}/api/login`, {
      data: { email, password: "wrong-pass" },
    });

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data).toHaveProperty("error", "Invalid credentials");
  });

  test("should reject missing or invalid fields", async ({ request }) => {
    const missing = await request.post(`${API_URL}/api/login`, {
      data: { email: "ada@astro.test" },
    });
    expect(missing.status()).toBe(400);

    const invalid = await request.post(`${API_URL}/api/login`, {
      data: { email: "not-an-email", password: "secret-pass" },
    });
    expect(invalid.status()).toBe(400);
    const data = await invalid.json();
    expect(data).toHaveProperty("error", "Invalid email format");
  });

  test("should return the profile for GET /api/me with a valid token", async ({ request }) => {
    const email = uniqueEmail();
    const created = await request.post(`${API_URL}/api/register`, {
      data: { email, name: "Ada", password: "secret-pass" },
    });
    const registered = await created.json();

    const response = await request.get(`${API_URL}/api/me`, {
      headers: { Authorization: `Bearer ${registered.token}` },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ email, id: registered.id, name: "Ada" });
    expect(data).not.toHaveProperty("password");
  });

  test("should reject GET /api/me without a valid token", async ({ request }) => {
    const missing = await request.get(`${API_URL}/api/me`);
    expect(missing.status()).toBe(401);

    const invalid = await request.get(`${API_URL}/api/me`, {
      headers: { Authorization: "Bearer unknown-token" },
    });
    expect(invalid.status()).toBe(401);
    const data = await invalid.json();
    expect(data).toHaveProperty("error", "Invalid or missing token");
  });
});
