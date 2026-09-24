import { escapeHtml } from "../core/escape-html.js";
import "../shared/components/page-header.component.js";
import { goTo } from "../shared/navigate.js";
import { createLaunch } from "../shared/repositories/launches.repository.js";
import { listRockets, type Rocket } from "../shared/repositories/rockets.repository.js";
import { leaveIfAnonymous } from "./leave-if-anonymous.js";

export const tagName = "ab-launch-form-page";

const enabledRockets = (rockets: readonly Rocket[]): Rocket[] =>
  rockets.filter((rocket) => !rocket.disabled);

const rocketOptions = (rockets: readonly Rocket[]): string =>
  enabledRockets(rockets)
    .map((rocket) => `<option value="${rocket.id}">${escapeHtml(rocket.name)}</option>`)
    .join("");

class LaunchFormPage extends HTMLElement {
  public connectedCallback(): void {
    if (leaveIfAnonymous()) return;
    this.innerHTML = `
      <ab-page-header heading="Plan a launch" subtitle="A future flight stays planned."></ab-page-header>
      <form id="launch-form">
        <label for="launch-rocket">Rocket</label>
        <select id="launch-rocket" name="rocketId" required></select>
        <label for="launch-date">Date</label>
        <input id="launch-date" name="scheduledAt" type="datetime-local" required />
        <label for="launch-price">Price per passenger</label>
        <input id="launch-price" name="pricePerPassenger" type="number" min="0.01" step="any" required />
        <button type="submit">Plan launch</button>
      </form>
      <p id="launch-error" role="alert"></p>`;
    this.#loadRockets();
    this.querySelector("#launch-form")?.addEventListener("submit", (event: Readonly<Event>) => {
      event.preventDefault();
      this.#submit();
    });
  }

  #loadRockets(): void {
    listRockets()
      .then((rockets) => {
        const select = this.querySelector<HTMLSelectElement>("#launch-rocket");
        if (!select) return;
        const options = rocketOptions(rockets);
        select.innerHTML = options;
        if (!options) {
          this.#showError("No enabled rockets.");
        }
      })
      .catch((error: unknown) => {
        this.#showError(error);
      });
  }

  #showError(error: unknown): void {
    const errorEl = this.querySelector<HTMLElement>("#launch-error");
    if (!errorEl) return;
    errorEl.textContent = error instanceof Error ? error.message : String(error);
  }

  #submit(): void {
    const rocketId = Number(this.querySelector<HTMLSelectElement>("#launch-rocket")?.value);
    const dateValue = this.querySelector<HTMLInputElement>("#launch-date")?.value ?? "";
    const price = Number(this.querySelector<HTMLInputElement>("#launch-price")?.value);
    const scheduled = new Date(dateValue);
    if (!Number.isInteger(rocketId) || rocketId <= 0) {
      this.#showError("Choose an enabled rocket.");
      return;
    }
    if (Number.isNaN(scheduled.getTime()) || scheduled.getTime() <= Date.now()) {
      this.#showError("Choose a future date.");
      return;
    }
    if (!(price > 0)) {
      this.#showError("Price per passenger must be greater than zero.");
      return;
    }
    this.#showError("");
    createLaunch({
      pricePerPassenger: price,
      rocketId,
      scheduledAt: scheduled.toISOString(),
    })
      .then((launch) => {
        goTo(`/launches/${launch.id}`);
      })
      .catch((error: unknown) => {
        this.#showError(error);
      });
  }
}

customElements.define(tagName, LaunchFormPage);
