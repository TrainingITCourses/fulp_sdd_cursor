import { escapeHtml } from "../core/escape-html.js";
import "../shared/components/page-header.component.js";
import {
  cancelLaunch,
  getLaunch,
  type CancellationCauseType,
} from "../shared/repositories/launches.repository.js";
import { getRocket } from "../shared/repositories/rockets.repository.js";
import { renderLaunchDetail } from "./launch-detail.view.js";
import { leaveIfAnonymous } from "./leave-if-anonymous.js";

export const tagName = "ab-launch-detail-page";

const CAUSE_TYPES = ["economic", "meteorological", "technical"] as const;

const isCauseType = (value: string): value is CancellationCauseType =>
  (CAUSE_TYPES as readonly string[]).includes(value);

class LaunchDetailPage extends HTMLElement {
  #rocketLabel = "";

  public connectedCallback(): void {
    if (leaveIfAnonymous()) return;
    const launchId = this.getAttribute("launch-id") ?? "";
    this.#load(launchId);
  }

  #load(launchId: string): void {
    getLaunch(launchId)
      .then(async (launch) => {
        const rocket = await getRocket(String(launch.rocketId)).catch(() => undefined);
        this.#rocketLabel = rocket?.name ?? `#${launch.rocketId}`;
        this.#show(launch);
      })
      .catch((error: unknown) => {
        this.#showError(error);
      });
  }

  #show(launch: Parameters<typeof renderLaunchDetail>[0]): void {
    this.innerHTML = renderLaunchDetail(launch, this.#rocketLabel);
    this.querySelector("#cancel-form")?.addEventListener("submit", (event: Readonly<Event>) => {
      event.preventDefault();
      this.#submit(String(launch.id));
    });
  }

  #showError(error: unknown): void {
    const message = error instanceof Error ? error.message : "Request failed.";
    const errorEl = this.querySelector<HTMLElement>("#cancel-error");
    if (errorEl) {
      errorEl.textContent = message;
      return;
    }
    this.innerHTML = `<p id="launch-error" role="alert">${escapeHtml(message)}</p>`;
  }

  #submit(launchId: string): void {
    const causeType = this.querySelector<HTMLSelectElement>("#cancel-cause-type")?.value ?? "";
    const causeText =
      this.querySelector<HTMLTextAreaElement>("#cancel-cause-text")?.value.trim() ?? "";
    if (!isCauseType(causeType) || causeText === "") {
      this.#showError("Choose a cause type and describe it.");
      return;
    }
    cancelLaunch(launchId, { causeText, causeType })
      .then((launch) => {
        this.#show(launch);
      })
      .catch((error: unknown) => {
        this.#showError(error);
      });
  }
}

customElements.define(tagName, LaunchDetailPage);
