import { escapeHtml } from "../core/escape-html.js";
import "../shared/components/page-header.component.js";
import { listRockets, type Rocket } from "../shared/repositories/rockets.repository.js";
import { leaveIfAnonymous } from "./leave-if-anonymous.js";

export const tagName = "ab-rockets-page";

const RANGE_LABEL: Record<Rocket["range"], string> = {
  earth: "Earth",
  moon: "Moon",
  mars: "Mars",
};

const statusLabel = (disabled: boolean): string => (disabled ? "Disabled" : "Enabled");

const renderItem = (rocket: Readonly<Rocket>): string => `
  <li>
    <a href="/rockets/${rocket.id}">${escapeHtml(rocket.name)}</a>
    <span>${escapeHtml(RANGE_LABEL[rocket.range])}</span>
    <span>${rocket.capacity}</span>
    <span>${statusLabel(rocket.disabled)}</span>
  </li>`;

const renderList = (rockets: readonly Rocket[]): string => {
  if (rockets.length === 0) {
    return "<p>No rockets yet.</p>";
  }
  return `<ul>${rockets.map((rocket) => renderItem(rocket)).join("")}</ul>`;
};

class RocketsPage extends HTMLElement {
  public connectedCallback(): void {
    if (leaveIfAnonymous()) return;
    this.innerHTML = `
      <ab-page-header heading="Rockets" subtitle="Fleet catalog."></ab-page-header>
      <p><a href="/rockets/new">New rocket</a></p>
      <div id="rocket-list"><p>Loading rockets…</p></div>
      <p id="rocket-error" role="alert"></p>`;
    this.#load();
  }

  #load(): void {
    listRockets()
      .then((rockets) => {
        const list = this.querySelector("#rocket-list");
        if (list) list.innerHTML = renderList(rockets);
      })
      .catch((error: unknown) => {
        const errorEl = this.querySelector("#rocket-error");
        if (errorEl) errorEl.textContent = error instanceof Error ? error.message : "Load failed.";
      });
  }
}

customElements.define(tagName, RocketsPage);
