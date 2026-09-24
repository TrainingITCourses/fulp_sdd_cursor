import { escapeHtml } from "../core/escape-html.js";
import "../shared/components/page-header.component.js";
import {
  disableRocket,
  getRocket,
  updateRocket,
  type Rocket,
  type RocketRange,
} from "../shared/repositories/rockets.repository.js";
import { leaveIfAnonymous } from "./leave-if-anonymous.js";

export const tagName = "ab-rocket-detail-page";

const RANGE_LABEL: Record<RocketRange, string> = {
  earth: "Earth",
  moon: "Moon",
  mars: "Mars",
};

const isRange = (value: string): value is RocketRange =>
  value === "earth" || value === "moon" || value === "mars";

const statusLabel = (disabled: boolean): string => (disabled ? "Disabled" : "Enabled");

const rangeOptions = (selected: RocketRange): string =>
  (["earth", "moon", "mars"] as const)
    .map(
      (range) =>
        `<option value="${range}"${range === selected ? " selected" : ""}>${RANGE_LABEL[range]}</option>`,
    )
    .join("");

const disableButton = (rocket: Readonly<Rocket>): string =>
  rocket.disabled ? "" : `<button id="disable-rocket" type="button">Disable</button>`;

const renderRocket = (rocket: Readonly<Rocket>): string => `
  <ab-page-header heading="${escapeHtml(rocket.name)}"></ab-page-header>
  <p>Range: <span id="rocket-range-label">${escapeHtml(RANGE_LABEL[rocket.range])}</span></p>
  <p>Capacity: <strong>9</strong></p>
  <p>Status: <span id="rocket-status">${statusLabel(rocket.disabled)}</span></p>
  <form id="rocket-edit">
    <label for="rocket-name">Name</label>
    <input id="rocket-name" name="name" value="${escapeHtml(rocket.name)}" required />
    <label for="rocket-range">Range</label>
    <select id="rocket-range" name="range" required>${rangeOptions(rocket.range)}</select>
    <button type="submit">Save</button>
  </form>
  ${disableButton(rocket)}
  <p id="rocket-error" role="alert"></p>
  <p><a href="/rockets">Back to fleet</a></p>`;

class RocketDetailPage extends HTMLElement {
  public connectedCallback(): void {
    if (leaveIfAnonymous()) return;
    const rocketId = this.getAttribute("rocket-id") ?? "";
    this.#load(rocketId);
  }

  #load(rocketId: string): void {
    getRocket(rocketId)
      .then((rocket) => {
        this.#paint(rocket);
      })
      .catch((error: unknown) => {
        this.#showError(error);
      });
  }

  #paint(rocket: Readonly<Rocket>): void {
    this.innerHTML = renderRocket(rocket);
    this.querySelector("#rocket-edit")?.addEventListener("submit", (event: Readonly<Event>) => {
      event.preventDefault();
      this.#save(String(rocket.id));
    });
    this.querySelector("#disable-rocket")?.addEventListener("click", () => {
      this.#disable(String(rocket.id));
    });
  }

  #showError(error: unknown): void {
    const errorEl = this.querySelector<HTMLElement>("#rocket-error");
    const message = error instanceof Error ? error.message : "Request failed.";
    if (errorEl) {
      errorEl.textContent = message;
      return;
    }
    this.innerHTML = `<p id="rocket-error" role="alert">${escapeHtml(message)}</p>`;
  }

  #readWrite(): { name: string; range: RocketRange } | undefined {
    const name = this.querySelector<HTMLInputElement>("#rocket-name")?.value ?? "";
    const rangeValue = this.querySelector<HTMLSelectElement>("#rocket-range")?.value ?? "";
    if (!isRange(rangeValue)) return undefined;
    return { name, range: rangeValue };
  }

  #save(rocketId: string): void {
    const body = this.#readWrite();
    if (!body) return;
    updateRocket(rocketId, body)
      .then((rocket) => {
        this.#paint(rocket);
      })
      .catch((error: unknown) => {
        this.#showError(error);
      });
  }

  #disable(rocketId: string): void {
    disableRocket(rocketId)
      .then((rocket) => {
        this.#paint(rocket);
      })
      .catch((error: unknown) => {
        this.#showError(error);
      });
  }
}

customElements.define(tagName, RocketDetailPage);
