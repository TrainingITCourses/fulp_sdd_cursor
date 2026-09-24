import { escapeHtml } from "../core/escape-html.js";
import "../shared/components/page-header.component.js";
import { listLaunches, type Launch } from "../shared/repositories/launches.repository.js";
import { listRockets, type Rocket } from "../shared/repositories/rockets.repository.js";
import { leaveIfAnonymous } from "./leave-if-anonymous.js";

export const tagName = "ab-launches-page";

const STATUS_LABEL: Record<Launch["status"], string> = {
  planned: "Planned",
  confirmed: "Confirmed",
  successful: "Successful",
  cancelled: "Cancelled",
};

const rocketName = (rockets: readonly Rocket[], rocketId: number): string =>
  rockets.find((rocket) => rocket.id === rocketId)?.name ?? `#${rocketId}`;

const renderItem = (launch: Readonly<Launch>, rockets: readonly Rocket[]): string => `
  <li>
    <a href="/launches/${launch.id}">${escapeHtml(launch.scheduledAt)}</a>
    <span>${escapeHtml(rocketName(rockets, launch.rocketId))}</span>
    <span>${launch.pricePerPassenger}</span>
    <span>${escapeHtml(STATUS_LABEL[launch.status])}</span>
  </li>`;

const renderList = (launches: readonly Launch[], rockets: readonly Rocket[]): string => {
  if (launches.length === 0) {
    return "<p>No launches yet.</p>";
  }
  return `<ul>${launches.map((launch) => renderItem(launch, rockets)).join("")}</ul>`;
};

class LaunchesPage extends HTMLElement {
  public connectedCallback(): void {
    if (leaveIfAnonymous()) return;
    this.innerHTML = `
      <ab-page-header heading="Launches" subtitle="Planned flights."></ab-page-header>
      <p><a href="/launches/new">Plan a launch</a></p>
      <div id="launch-list"><p>Loading launches…</p></div>
      <p id="launch-error" role="alert"></p>`;
    this.#load();
  }

  #load(): void {
    Promise.all([listLaunches(), listRockets()])
      .then(([launches, rockets]) => {
        const list = this.querySelector("#launch-list");
        if (list) list.innerHTML = renderList(launches, rockets);
      })
      .catch((error: unknown) => {
        const errorEl = this.querySelector("#launch-error");
        if (errorEl) errorEl.textContent = error instanceof Error ? error.message : "Load failed.";
      });
  }
}

customElements.define(tagName, LaunchesPage);
