import { escapeHtml } from "../core/escape-html.js";
import "../shared/components/page-header.component.js";
import { getLaunch, type Launch } from "../shared/repositories/launches.repository.js";
import { getRocket } from "../shared/repositories/rockets.repository.js";
import { leaveIfAnonymous } from "./leave-if-anonymous.js";

export const tagName = "ab-launch-detail-page";

const STATUS_LABEL: Record<Launch["status"], string> = {
  planned: "Planned",
  confirmed: "Confirmed",
  successful: "Successful",
  cancelled: "Cancelled",
};

const renderLaunch = (launch: Readonly<Launch>, rocketLabel: string): string => `
  <ab-page-header heading="Launch #${launch.id}"></ab-page-header>
  <p>Rocket: <span id="launch-rocket">${escapeHtml(rocketLabel)}</span></p>
  <p>Date: <span id="launch-date">${escapeHtml(launch.scheduledAt)}</span></p>
  <p>Price per passenger: <span id="launch-price">${launch.pricePerPassenger}</span></p>
  <p>Status: <span id="launch-status">${escapeHtml(STATUS_LABEL[launch.status])}</span></p>
  <p><a href="/launches">Back to launches</a></p>`;

class LaunchDetailPage extends HTMLElement {
  public connectedCallback(): void {
    if (leaveIfAnonymous()) return;
    const launchId = this.getAttribute("launch-id") ?? "";
    this.#load(launchId);
  }

  #load(launchId: string): void {
    getLaunch(launchId)
      .then(async (launch) => {
        const rocket = await getRocket(String(launch.rocketId)).catch(() => undefined);
        this.innerHTML = renderLaunch(launch, rocket?.name ?? `#${launch.rocketId}`);
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Request failed.";
        this.innerHTML = `<p id="launch-error" role="alert">${escapeHtml(message)}</p>`;
      });
  }
}

customElements.define(tagName, LaunchDetailPage);
