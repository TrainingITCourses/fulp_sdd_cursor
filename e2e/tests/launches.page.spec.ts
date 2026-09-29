import { type APIRequestContext, expect, type Page, test } from "@playwright/test";
import authFixture from "./fixtures/auth.json" with { type: "json" };
import { uniqueEmail } from "./fixtures/test-data.js";
import { LoginPage } from "./pages/auth.page.js";
import { setLaunchStatus } from "./support/set-launch-status.js";

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

const planFromApi = async (
  page: Page,
  request: APIRequestContext,
  label: string,
): Promise<{ id: number; name: string; headers: { Authorization: string } }> => {
  const headers = { Authorization: `Bearer ${await browserToken(page)}` };
  const name = uniqueName(label);
  const rocket = await request.post(`${process.env["E2E_BACK_URL"]}/api/rockets`, {
    headers,
    data: { name, range: "earth" },
  });
  expect(rocket.status()).toBe(201);
  const rocketId = ((await rocket.json()) as { id: number }).id;
  const created = await request.post(`${process.env["E2E_BACK_URL"]}/api/launches`, {
    headers,
    data: {
      rocketId,
      scheduledAt: new Date(Date.now() + 172_800_000).toISOString(),
      pricePerPassenger: 1500,
    },
  });
  expect(created.status()).toBe(201);
  const id = ((await created.json()) as { id: number }).id;
  return { headers, id, name };
};

test.describe("Cancel launch pages", () => {
  test("AC-CNL-09 cancels from the detail and shows the cause, time and user", async ({
    page,
    request,
  }) => {
    await registerAndLogin(page, request, "cancel");
    const { id } = await planFromApi(page, request, "cancel-rocket");
    await page.goto(`/launches/${id}`);
    await expect(page.locator("#cancel-form")).toBeVisible();
    await page.locator("#cancel-cause-type").selectOption("technical");
    await page.locator("#cancel-cause-text").fill("Valve leak");
    await page.getByRole("button", { name: "Cancel launch" }).click();

    await expect(page.locator("#launch-status")).toHaveText("Cancelled");
    await expect(page.locator("#launch-cause-type")).toHaveText("Técnico");
    await expect(page.locator("#launch-cause-text")).toHaveText("Valve leak");
    await expect(page.locator("#launch-cancelled-at")).not.toBeEmpty();
    await expect(page.locator("#launch-cancelled-by")).toHaveText(authFixture.users.ada.name);
    await expect(page.locator("#cancel-form")).toHaveCount(0);
  });

  test("AC-CNL-10 shows a cancelled launch without the form", async ({ page, request }) => {
    await registerAndLogin(page, request, "closed");
    const { id, headers } = await planFromApi(page, request, "closed-rocket");
    const cancelled = await request.post(
      `${process.env["E2E_BACK_URL"]}/api/launches/${id}/cancel`,
      {
        headers,
        data: { causeType: "economic", causeText: "Budget cut" },
      },
    );
    expect(cancelled.status()).toBe(200);

    await page.goto(`/launches/${id}`);
    await expect(page.locator("#launch-cause-type")).toHaveText("Económico");
    await expect(page.locator("#launch-cause-text")).toHaveText("Budget cut");
    await expect(page.locator("#launch-cancelled-by")).toHaveText(authFixture.users.ada.name);
    await expect(page.locator("#cancel-form")).toHaveCount(0);
  });

  test("AC-CNL-11 hides the form when the launch is successful", async ({ page, request }) => {
    await registerAndLogin(page, request, "done");
    const { id } = await planFromApi(page, request, "done-rocket");
    setLaunchStatus(id, "successful");

    await page.goto(`/launches/${id}`);
    await expect(page.locator("#launch-status")).toHaveText("Successful");
    await expect(page.locator("#cancel-form")).toHaveCount(0);
    await expect(page.locator("#launch-cause-type")).toHaveCount(0);
  });

  test("AC-CNL-12 lists the cancelled status without the cause", async ({ page, request }) => {
    await registerAndLogin(page, request, "listed-cancel");
    const cause = `Pad closed ${uniqueName("cause")}`;
    const { id, name, headers } = await planFromApi(page, request, "listed-rocket");
    const cancelled = await request.post(
      `${process.env["E2E_BACK_URL"]}/api/launches/${id}/cancel`,
      {
        headers,
        data: { causeType: "meteorological", causeText: cause },
      },
    );
    expect(cancelled.status()).toBe(200);

    await page.goto("/launches");
    const item = page.getByRole("listitem").filter({ hasText: name });
    await expect(item).toContainText("Cancelled");
    await expect(item).not.toContainText(cause);
    await expect(item).not.toContainText(authFixture.users.ada.name);
  });
});

const bookFromApi = async (
  request: APIRequestContext,
  headers: { Authorization: string },
  launchId: number,
  label: string,
): Promise<void> => {
  const booked = await request.post(
    `${process.env["E2E_BACK_URL"]}/api/launches/${launchId}/bookings`,
    {
      headers,
      data: { email: `${label}@example.com`, name: `Passenger ${label}`, phone: "+34 600 000 000" },
    },
  );
  expect(booked.status()).toBe(201);
};

test.describe("Booking pages", () => {
  test("AC-BKG-09 books a seat from the detail and shows the passenger and free seats", async ({
    page,
    request,
  }) => {
    await registerAndLogin(page, request, "book");
    const { id } = await planFromApi(page, request, "book-rocket");
    const name = uniqueName("Grace");
    await page.goto(`/launches/${id}`);
    await expect(page.locator("#launch-free-seats")).toHaveText("9 of 9");

    await page.getByLabel("Passenger name").fill(name);
    await page.getByLabel("Passenger email").fill("grace@example.com");
    await page.getByLabel("Passenger phone").fill("+34 600 111 222");
    await page.getByRole("button", { name: "Book seat" }).click();

    const row = page.getByRole("row").filter({ hasText: name });
    await expect(row).toContainText("grace@example.com");
    await expect(row).toContainText("+34 600 111 222");
    await expect(page.locator("#launch-free-seats")).toHaveText("8 of 9");
    await expect(page).toHaveURL(new RegExp(`/launches/${id}$`));
    await expect(page.locator("#booking-form")).toBeVisible();
  });

  test("AC-BKG-02 keeps an empty passenger off the launch from the detail", async ({
    page,
    request,
  }) => {
    await registerAndLogin(page, request, "book-empty");
    const { id } = await planFromApi(page, request, "book-empty-rocket");
    await page.goto(`/launches/${id}`);
    await page.getByLabel("Passenger name").fill("   ");
    await page.getByLabel("Passenger email").fill("grace@example.com");
    await page.getByLabel("Passenger phone").fill("600");
    await page.getByRole("button", { name: "Book seat" }).click();

    await expect(page.locator("#booking-error")).not.toBeEmpty();
    await expect(page.locator("#launch-free-seats")).toHaveText("9 of 9");
    await expect(page.locator("#launch-passengers")).toHaveCount(0);
  });

  test("AC-BKG-10 hides the form and says no seats are left when the launch is full", async ({
    page,
    request,
  }) => {
    await registerAndLogin(page, request, "book-full");
    const { id, headers } = await planFromApi(page, request, "book-full-rocket");
    for (let seat = 1; seat <= 9; seat += 1) {
      await bookFromApi(request, headers, id, `full${seat}`);
    }

    await page.goto(`/launches/${id}`);
    await expect(page.locator("#launch-free-seats")).toHaveText("No seats left");
    await expect(page.getByRole("row").filter({ hasText: "Passenger full9" })).toBeVisible();
    await expect(page.locator("#booking-form")).toHaveCount(0);
  });

  test("AC-BKG-11 hides the form but lists passengers when the launch is not planned", async ({
    page,
    request,
  }) => {
    await registerAndLogin(page, request, "book-closed");
    const { id, headers } = await planFromApi(page, request, "book-closed-rocket");
    await bookFromApi(request, headers, id, "closed1");
    setLaunchStatus(id, "confirmed");

    await page.goto(`/launches/${id}`);
    await expect(page.locator("#launch-status")).toHaveText("Confirmed");
    await expect(page.getByRole("row").filter({ hasText: "Passenger closed1" })).toBeVisible();
    await expect(page.locator("#booking-form")).toHaveCount(0);
  });

  test("AC-BKG-12 keeps passengers off the launches list", async ({ page, request }) => {
    await registerAndLogin(page, request, "book-list");
    const { id, name, headers } = await planFromApi(page, request, "book-list-rocket");
    const label = uniqueName("listed").replaceAll("-", "");
    await bookFromApi(request, headers, id, label);

    await page.goto("/launches");
    const item = page.getByRole("listitem").filter({ hasText: name });
    await expect(item).toBeVisible();
    await expect(item).not.toContainText(`Passenger ${label}`);
  });

  test("AC-BKG-13 sends an anonymous visitor on a detail to login", async ({ page }) => {
    await page.goto("/launches/1");
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe("Cancel booking pages", () => {
  test("AC-CBK-06 shows a cancel action on each passenger of a planned launch", async ({
    page,
    request,
  }) => {
    await registerAndLogin(page, request, "unbook-list");
    const { id, headers } = await planFromApi(page, request, "unbook-list-rocket");
    await bookFromApi(request, headers, id, "unbook1");
    await bookFromApi(request, headers, id, "unbook2");

    await page.goto(`/launches/${id}`);
    for (const label of ["unbook1", "unbook2"]) {
      const row = page.getByRole("row").filter({ hasText: `Passenger ${label}` });
      await expect(row.getByRole("button", { name: "Cancel booking" })).toBeVisible();
    }
  });

  test("AC-CBK-07 cancels a booking from the detail and shows the freed seat", async ({
    page,
    request,
  }) => {
    await registerAndLogin(page, request, "unbook");
    const { id, headers } = await planFromApi(page, request, "unbook-rocket");
    await bookFromApi(request, headers, id, "keep");
    await bookFromApi(request, headers, id, "drop");
    await page.goto(`/launches/${id}`);
    await expect(page.locator("#launch-free-seats")).toHaveText("7 of 9");

    const row = page.getByRole("row").filter({ hasText: "Passenger drop" });
    await row.getByRole("button", { name: "Cancel booking" }).click();

    await expect(page.getByRole("row").filter({ hasText: "Passenger drop" })).toHaveCount(0);
    await expect(page.getByRole("row").filter({ hasText: "Passenger keep" })).toBeVisible();
    await expect(page.locator("#launch-free-seats")).toHaveText("8 of 9");
    await expect(page).toHaveURL(new RegExp(`/launches/${id}$`));
  });

  test("AC-CBK-07 shows the booking form again after freeing a seat on a full launch", async ({
    page,
    request,
  }) => {
    await registerAndLogin(page, request, "unbook-full");
    const { id, headers } = await planFromApi(page, request, "unbook-full-rocket");
    for (let seat = 1; seat <= 9; seat += 1) {
      await bookFromApi(request, headers, id, `seat${seat}`);
    }
    await page.goto(`/launches/${id}`);
    await expect(page.locator("#launch-free-seats")).toHaveText("No seats left");
    await expect(page.locator("#booking-form")).toHaveCount(0);

    const row = page.getByRole("row").filter({ hasText: "Passenger seat9" });
    await row.getByRole("button", { name: "Cancel booking" }).click();

    await expect(page.locator("#launch-free-seats")).toHaveText("1 of 9");
    await expect(page.locator("#booking-form")).toBeVisible();
  });

  test("AC-CBK-08 hides the cancel action when the launch is not planned", async ({
    page,
    request,
  }) => {
    await registerAndLogin(page, request, "unbook-closed");
    const { id, headers } = await planFromApi(page, request, "unbook-closed-rocket");
    await bookFromApi(request, headers, id, "locked");
    setLaunchStatus(id, "confirmed");

    await page.goto(`/launches/${id}`);
    await expect(page.locator("#launch-status")).toHaveText("Confirmed");
    await expect(page.getByRole("row").filter({ hasText: "Passenger locked" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel booking" })).toHaveCount(0);
  });

  test("AC-CBK-09 sends an anonymous visitor on a detail to login", async ({ page }) => {
    await page.goto("/launches/1");
    await expect(page).toHaveURL(/\/login$/);
  });
});
