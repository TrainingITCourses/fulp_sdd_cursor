import { type Locator, type Page } from "@playwright/test";
import { BasePage } from "./base.page.js";

export class RocketsPage extends BasePage {
  readonly newRocketLink: Locator;
  readonly list: Locator;

  constructor(page: Page) {
    super(page);
    this.newRocketLink = page.getByRole("link", { name: "New rocket" });
    this.list = page.getByRole("list");
  }

  async goto(): Promise<void> {
    await this.navigate("/rockets");
  }
}

export class RocketFormPage extends BasePage {
  readonly nameInput: Locator;
  readonly rangeSelect: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.nameInput = page.getByLabel("Name");
    this.rangeSelect = page.getByLabel("Range");
    this.submitButton = page.getByRole("button", { name: "Create rocket" });
  }

  async goto(): Promise<void> {
    await this.navigate("/rockets/new");
  }
}

export class RocketDetailPage extends BasePage {
  readonly nameInput: Locator;
  readonly rangeSelect: Locator;
  readonly saveButton: Locator;
  readonly disableButton: Locator;
  readonly status: Locator;

  constructor(page: Page) {
    super(page);
    this.nameInput = page.getByLabel("Name");
    this.rangeSelect = page.getByLabel("Range");
    this.saveButton = page.getByRole("button", { name: "Save" });
    this.disableButton = page.getByRole("button", { name: "Disable" });
    this.status = page.locator("#rocket-status");
  }

  async goto(rocketId: string): Promise<void> {
    await this.navigate(`/rockets/${rocketId}`);
  }
}
