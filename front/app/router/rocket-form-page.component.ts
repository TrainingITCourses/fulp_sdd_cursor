import "../shared/components/page-header.component.js";
import { goTo } from "../shared/navigate.js";
import { createRocket, type RocketRange } from "../shared/repositories/rockets.repository.js";
import { leaveIfAnonymous } from "./leave-if-anonymous.js";

export const tagName = "ab-rocket-form-page";

const isRange = (value: string): value is RocketRange =>
  value === "earth" || value === "moon" || value === "mars";

class RocketFormPage extends HTMLElement {
  public connectedCallback(): void {
    if (leaveIfAnonymous()) return;
    this.innerHTML = `
      <ab-page-header heading="New rocket" subtitle="Add a rocket to the fleet."></ab-page-header>
      <form id="rocket-form">
        <label for="rocket-name">Name</label>
        <input id="rocket-name" name="name" required />
        <label for="rocket-range">Range</label>
        <select id="rocket-range" name="range" required>
          <option value="earth">Earth</option>
          <option value="moon">Moon</option>
          <option value="mars">Mars</option>
        </select>
        <p>Capacity: <strong>9</strong></p>
        <button type="submit">Create rocket</button>
      </form>
      <p id="rocket-error" role="alert"></p>`;
    this.querySelector("#rocket-form")?.addEventListener("submit", (event: Readonly<Event>) => {
      event.preventDefault();
      this.#submit();
    });
  }

  #submit(): void {
    const name = this.querySelector<HTMLInputElement>("#rocket-name")?.value ?? "";
    const rangeValue = this.querySelector<HTMLSelectElement>("#rocket-range")?.value ?? "";
    const errorEl = this.querySelector<HTMLElement>("#rocket-error");
    if (!errorEl || !isRange(rangeValue)) return;
    errorEl.textContent = "";
    createRocket({ name, range: rangeValue })
      .then((rocket) => {
        goTo(`/rockets/${rocket.id}`);
      })
      .catch((error: unknown) => {
        errorEl.textContent = error instanceof Error ? error.message : "Create failed.";
      });
  }
}

customElements.define(tagName, RocketFormPage);
