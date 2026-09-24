import { expect, test } from "@playwright/test";
import authFixture from "./fixtures/auth.json" with { type: "json" };
import { uniqueEmail } from "./fixtures/test-data.js";
import { LoginPage } from "./pages/auth.page.js";
import { RocketDetailPage, RocketFormPage, RocketsPage } from "./pages/rockets.page.js";

const uniqueName = (label: string): string =>
  `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

test.describe("Rockets pages", () => {
  test("AC-RKT-17 sends an anonymous visitor to login", async ({ page }) => {
    await page.goto("/rockets");
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/rockets/new");
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/rockets/1");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("AC-RKT-13 lists name, range, capacity 9 and status", async ({ page, request }) => {
    const email = uniqueEmail("list");
    const registered = await request.post(`${process.env["E2E_BACK_URL"]}/api/auth/register`, {
      data: { email, name: authFixture.users.ada.name, password: authFixture.users.ada.password },
    });
    expect(registered.status()).toBe(201);

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.submit({ email, password: authFixture.users.ada.password });
    await expect(page.getByRole("link", { name: "Rockets" })).toBeVisible();

    const name = uniqueName("listed");
    const form = new RocketFormPage(page);
    await form.goto();
    await form.nameInput.fill(name);
    await form.rangeSelect.selectOption("earth");
    await form.submitButton.click();

    const fleet = new RocketsPage(page);
    await fleet.goto();
    const item = page.getByRole("listitem").filter({ hasText: name });
    await expect(item).toContainText("Earth");
    await expect(item).toContainText("9");
    await expect(item).toContainText("Enabled");
  });

  test("AC-RKT-14 creates a rocket and opens its detail with fixed capacity 9", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("create");
    const registered = await request.post(`${process.env["E2E_BACK_URL"]}/api/auth/register`, {
      data: { email, name: authFixture.users.ada.name, password: authFixture.users.ada.password },
    });
    expect(registered.status()).toBe(201);
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.submit({ email, password: authFixture.users.ada.password });
    await expect(page.getByRole("link", { name: "Rockets" })).toBeVisible();

    const form = new RocketFormPage(page);
    await form.goto();
    await expect(page.getByText("Capacity:")).toBeVisible();
    await expect(page.getByText("9", { exact: true })).toBeVisible();
    const name = uniqueName("new");
    await form.nameInput.fill(name);
    await form.rangeSelect.selectOption("moon");
    await form.submitButton.click();

    await expect(page).toHaveURL(/\/rockets\/\d+$/);
    await expect(page.getByRole("heading", { name })).toBeVisible();
    await expect(page.getByText("Moon")).toBeVisible();
  });

  test("AC-RKT-15 saves a new name and range on the detail", async ({ page, request }) => {
    const email = uniqueEmail("edit");
    const registered = await request.post(`${process.env["E2E_BACK_URL"]}/api/auth/register`, {
      data: { email, name: authFixture.users.ada.name, password: authFixture.users.ada.password },
    });
    expect(registered.status()).toBe(201);
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.submit({ email, password: authFixture.users.ada.password });
    await expect(page.getByRole("link", { name: "Rockets" })).toBeVisible();

    const form = new RocketFormPage(page);
    await form.goto();
    await form.nameInput.fill(uniqueName("before"));
    await form.rangeSelect.selectOption("earth");
    await form.submitButton.click();
    await expect(page).toHaveURL(/\/rockets\/\d+$/);

    const detail = new RocketDetailPage(page);
    const nextName = uniqueName("after");
    await detail.nameInput.fill(nextName);
    await detail.rangeSelect.selectOption("mars");
    await detail.saveButton.click();

    await expect(page.getByRole("heading", { name: nextName })).toBeVisible();
    await expect(page.locator("#rocket-range-label")).toHaveText("Mars");
  });

  test("AC-RKT-16 disables a rocket and hides the disable button", async ({ page, request }) => {
    const email = uniqueEmail("off");
    const registered = await request.post(`${process.env["E2E_BACK_URL"]}/api/auth/register`, {
      data: { email, name: authFixture.users.ada.name, password: authFixture.users.ada.password },
    });
    expect(registered.status()).toBe(201);
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.submit({ email, password: authFixture.users.ada.password });
    await expect(page.getByRole("link", { name: "Rockets" })).toBeVisible();

    const form = new RocketFormPage(page);
    await form.goto();
    await form.nameInput.fill(uniqueName("retire"));
    await form.rangeSelect.selectOption("mars");
    await form.submitButton.click();

    const detail = new RocketDetailPage(page);
    await detail.disableButton.click();
    await expect(detail.status).toHaveText("Disabled");
    await expect(detail.disableButton).toHaveCount(0);
  });
});
