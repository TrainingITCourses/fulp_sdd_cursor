import { expect, test, type Page } from "@playwright/test";

const DEFAULT_BACK_PORT = 3000;
const backPort = process.env["BACK_PORT"] ?? DEFAULT_BACK_PORT;
const API_URL = `http://localhost:${backPort}`;

const uniqueEmail = (): string => `e2e-login-ui-${Date.now()}-${Math.random()}@astro.test`;

const readSession = (page: Page): Promise<string | null> =>
  page.evaluate(() => localStorage.getItem("session"));

test.describe("Login Page", () => {
  test("should include a login link in the navigation when there is no session", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Me" })).toHaveCount(0);
  });

  test("should show a form with email and password", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("should store a token, show the name in the menu and open the profile", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail();
    const created = await request.post(`${API_URL}/api/register`, {
      data: { email, name: "Ada", password: "secret-pass" },
    });
    expect(created.status()).toBe(201);
    const registered = await created.json();

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("secret-pass");
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page.getByText("Signed in as Ada")).toBeVisible();
    await expect
      .poll(async () => {
        const raw = await readSession(page);
        if (!raw) return null;
        const session = JSON.parse(raw) as { token?: string };
        return session.token ?? null;
      })
      .toEqual(expect.any(String));

    await expect(page.getByRole("navigation").getByText("Ada")).toBeVisible();
    await expect(page.getByRole("link", { name: "Me" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Login" })).toHaveCount(0);

    await page.getByRole("link", { name: "Me" }).click();
    await expect(page).toHaveURL("/me");
    await expect(page.getByRole("heading", { name: "My profile" })).toBeVisible();
    await expect(page.getByText(String(registered.id), { exact: true })).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
    await expect(page.locator("#outlet").getByText("Ada")).toBeVisible();
    await expect(page.locator("#outlet input")).toHaveCount(0);
  });

  test("should show an error and skip the token when credentials are wrong", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail();
    const created = await request.post(`${API_URL}/api/register`, {
      data: { email, name: "Ada", password: "secret-pass" },
    });
    expect(created.status()).toBe(201);

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("wrong-pass");
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page.getByRole("alert")).toHaveText("Invalid credentials");
    expect(await readSession(page)).toBeNull();
  });

  test("should keep native validation and skip the session when fields are invalid", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel("Password").fill("secret-pass");
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page.getByLabel("Email")).toHaveJSProperty("validity.valid", false);
    expect(await readSession(page)).toBeNull();
  });

  test("should show an error on /me without a session and not render another user", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail();
    const created = await request.post(`${API_URL}/api/register`, {
      data: { email, name: "Ada Lovelace", password: "secret-pass" },
    });
    expect(created.status()).toBe(201);

    await page.goto("/me");

    await expect(page.getByRole("alert")).toHaveText("Invalid or missing token");
    await expect(page.locator("#me-profile")).toBeHidden();
    await expect(page.locator("#outlet")).not.toContainText(email);
    await expect(page.locator("#outlet")).not.toContainText("Ada Lovelace");
  });
});
