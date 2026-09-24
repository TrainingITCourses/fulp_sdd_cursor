import { type APIRequestContext, expect, type Page, test } from "@playwright/test";
import authFixture from "./fixtures/auth.json" with { type: "json" };
import { uniqueEmail } from "./fixtures/test-data.js";
import { LoginPage } from "./pages/auth.page.js";

const uniqueName = (label: string): string =>
  `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const futureLocal = (): string => {
  const date = new Date(Date.now() + 86_400_000);
  const pad = (value: number): string => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const browserToken = async (page: Page): Promise<string> => {
  const token = await page.evaluate(() => {
    const raw = localStorage.getItem("auth");
    if (!raw) return "";
    const session = JSON.parse(raw) as { token?: string };
    return session.token ?? "";
  });
  expect(token.length).toBeGreaterThan(0);
  return token;
};

const registerAndLogin = async (
  page: Page,
  request: APIRequestContext,
  label: string,
): Promise<void> => {
  const email = uniqueEmail(label);
  const registered = await request.post(`${process.env["E2E_BACK_URL"]}/api/auth/register`, {
    data: { email, name: authFixture.users.ada.name, password: authFixture.users.ada.password },
  });
  expect(registered.status()).toBe(201);
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.submit({ email, password: authFixture.users.ada.password });
  await expect(page.getByRole("link", { name: "Launches" })).toBeVisible();
};

test.describe("Launches pages", () => {
  test("AC-LCH-13 sends an anonymous visitor to login", async ({ page }) => {
    await page.goto("/launches");
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/launches/new");
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/launches/1");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("AC-LCH-11 plans a future launch on an enabled rocket and opens the planned detail", async ({
    page,
    request,
  }) => {
    await registerAndLogin(page, request, "plan");
    const name = uniqueName("carrier");
    const rocket = await request.post(`${process.env["E2E_BACK_URL"]}/api/rockets`, {
      headers: { Authorization: `Bearer ${await browserToken(page)}` },
      data: { name, range: "moon" },
    });
    expect(rocket.status()).toBe(201);

    await page.goto("/launches/new");
    await expect(page.getByRole("heading", { name: "Plan a launch" })).toBeVisible();
    await page.locator("#launch-rocket").selectOption({ label: name });
    await page.locator("#launch-date").fill(futureLocal());
    await page.locator("#launch-price").fill("3200");
    await page.getByRole("button", { name: "Plan launch" }).click();

    await expect(page).toHaveURL(/\/launches\/\d+$/);
    await expect(page.locator("#launch-rocket")).toHaveText(name);
    await expect(page.locator("#launch-price")).toHaveText("3200");
    await expect(page.locator("#launch-status")).toHaveText("Planned");
  });

  test("AC-LCH-12 lists date, rocket, price per passenger and status", async ({
    page,
    request,
  }) => {
    await registerAndLogin(page, request, "list");
    const name = uniqueName("listed");
    const headers = { Authorization: `Bearer ${await browserToken(page)}` };
    const rocket = await request.post(`${process.env["E2E_BACK_URL"]}/api/rockets`, {
      headers,
      data: { name, range: "earth" },
    });
    expect(rocket.status()).toBe(201);
    const rocketId = ((await rocket.json()) as { id: number }).id;
    const scheduledAt = new Date(Date.now() + 172_800_000).toISOString();
    const created = await request.post(`${process.env["E2E_BACK_URL"]}/api/launches`, {
      headers,
      data: { rocketId, scheduledAt, pricePerPassenger: 1500 },
    });
    expect(created.status()).toBe(201);

    await page.goto("/launches");
    const item = page.getByRole("listitem").filter({ hasText: name });
    await expect(item).toContainText(scheduledAt);
    await expect(item).toContainText("1500");
    await expect(item).toContainText("Planned");
  });

  test("AC-LCH-03 and AC-LCH-04 keep a disabled rocket and a past date off the plan", async ({
    page,
    request,
  }) => {
    await registerAndLogin(page, request, "reject");
    const enabled = uniqueName("enabled");
    const retired = uniqueName("retired");
    const headers = { Authorization: `Bearer ${await browserToken(page)}` };
    const back = process.env["E2E_BACK_URL"];
    const kept = await request.post(`${back}/api/rockets`, {
      headers,
      data: { name: enabled, range: "earth" },
    });
    const gone = await request.post(`${back}/api/rockets`, {
      headers,
      data: { name: retired, range: "mars" },
    });
    expect(kept.status()).toBe(201);
    expect(gone.status()).toBe(201);
    const retiredId = ((await gone.json()) as { id: number }).id;
    const disabled = await request.post(`${back}/api/rockets/${retiredId}/disable`, { headers });
    expect(disabled.status()).toBe(200);

    await page.goto("/launches/new");
    await expect(
      page.locator("#launch-rocket").locator("option", { hasText: retired }),
    ).toHaveCount(0);
    await expect(
      page.locator("#launch-rocket").locator("option", { hasText: enabled }),
    ).toHaveCount(1);

    await page.locator("#launch-rocket").selectOption({ label: enabled });
    await page.locator("#launch-date").fill("2000-01-01T10:00");
    await page.locator("#launch-price").fill("900");
    await page.getByRole("button", { name: "Plan launch" }).click();
    await expect(page.getByRole("alert")).toHaveText("Choose a future date.");
    await expect(page).toHaveURL(/\/launches\/new$/);
  });
});
