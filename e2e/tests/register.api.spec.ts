import { expect, test } from "@playwright/test";

const DEFAULT_BACK_PORT = 3000;
const backPort = process.env["BACK_PORT"] ?? DEFAULT_BACK_PORT;
const API_URL = `http://localhost:${backPort}`;

const uniqueEmail = (): string => `e2e-${Date.now()}-${Math.random()}@astro.test`;

test.describe("Register API", () => {
  test("should create a user and return id, email, name and token", async ({ request }) => {
    const email = uniqueEmail();
    const response = await request.post(`${API_URL}/api/register`, {
      data: { email, name: "Ada", password: "secret-pass" },
    });

    expect(response.status()).toBe(201);

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

  test("should reject a duplicate email", async ({ request }) => {
    const email = uniqueEmail();
    const first = await request.post(`${API_URL}/api/register`, {
      data: { email, name: "Ada", password: "secret-pass" },
    });
    expect(first.status()).toBe(201);

    const second = await request.post(`${API_URL}/api/register`, {
      data: { email, name: "Other", password: "other-pass" },
    });

    expect(second.status()).toBe(409);
    const data = await second.json();
    expect(data).toHaveProperty("error", "Email already registered");
  });

  test("should reject missing or invalid fields", async ({ request }) => {
    const missing = await request.post(`${API_URL}/api/register`, {
      data: { email: "ada@astro.test" },
    });
    expect(missing.status()).toBe(400);

    const invalid = await request.post(`${API_URL}/api/register`, {
      data: { email: "not-an-email", name: "Ada", password: "secret-pass" },
    });
    expect(invalid.status()).toBe(400);
    const data = await invalid.json();
    expect(data).toHaveProperty("error", "Invalid email format");
  });
});
