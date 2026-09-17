import { expect, test, type Page } from "@playwright/test";

const DEFAULT_BACK_PORT = 3000;
const backPort = process.env["BACK_PORT"] ?? DEFAULT_BACK_PORT;
const API_URL = `http://localhost:${backPort}`;

const uniqueEmail = (): string => `e2e-ui-${Date.now()}-${Math.random()}@astro.test`;

const readSession = (page: Page): Promise<string | null> =>
  page.evaluate(() => localStorage.getItem("session"));

test.describe("Register Page", () => {
  test("should include a register link in the navigation", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: "Register" })).toBeVisible();
  });

  test("should show a form with email, name and password", async ({ page }) => {
    await page.goto("/register");

    await expect(page.getByRole("heading", { name: "Register" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("should store a token in the client after a successful register", async ({ page }) => {
    const email = uniqueEmail();
    await page.goto("/register");

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Name").fill("Ada");
    await page.getByLabel("Password").fill("secret-pass");
    await page.getByRole("button", { name: "Register" }).click();

    await expect(page.getByText("Registered as Ada")).toBeVisible();
    await expect
      .poll(async () => {
        const raw = await readSession(page);
        if (!raw) return null;
        const session = JSON.parse(raw) as { token?: string };
        return session.token ?? null;
      })
      .toEqual(expect.any(String));
  });

  test("should show an error and skip the token when the email is taken", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail();
    const created = await request.post(`${API_URL}/api/register`, {
      data: { email, name: "Ada", password: "secret-pass" },
    });
    expect(created.status()).toBe(201);

    await page.goto("/register");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Name").fill("Other");
    await page.getByLabel("Password").fill("other-pass");
    await page.getByRole("button", { name: "Register" }).click();

    await expect(page.getByRole("alert")).toHaveText("Email already registered");
    expect(await readSession(page)).toBeNull();
  });

  test("should keep native validation and skip the session when fields are invalid", async ({
    page,
  }) => {
    await page.goto("/register");
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel("Name").fill("Ada");
    await page.getByLabel("Password").fill("secret-pass");
    await page.getByRole("button", { name: "Register" }).click();

    await expect(page.getByLabel("Email")).toHaveJSProperty("validity.valid", false);
    expect(await readSession(page)).toBeNull();
  });
});
