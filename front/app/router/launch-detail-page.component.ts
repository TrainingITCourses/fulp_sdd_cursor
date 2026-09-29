import { escapeHtml } from "../core/escape-html.js";
import "../shared/components/page-header.component.js";
import {
  createBooking,
  listBookings,
  type LaunchBookings,
} from "../shared/repositories/bookings.repository.js";
import {
  cancelLaunch,
  getLaunch,
  type CancellationCauseType,
  type Launch,
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
  #seats: LaunchBookings = { bookings: [], capacity: 0, free: 0, taken: 0 };

  public connectedCallback(): void {
    if (leaveIfAnonymous()) return;
    const launchId = this.getAttribute("launch-id") ?? "";
    this.#load(launchId);
  }

  #load(launchId: string): void {
    Promise.all([getLaunch(launchId), listBookings(launchId)])
      .then(async ([launch, seats]) => {
        const rocket = await getRocket(String(launch.rocketId)).catch(() => undefined);
        this.#rocketLabel = rocket?.name ?? `#${launch.rocketId}`;
        this.#seats = seats;
        this.#show(launch);
      })
      .catch((error: unknown) => {
        this.#showError(error, "cancel-error");
      });
  }

  #show(launch: Readonly<Launch>): void {
    this.innerHTML = renderLaunchDetail(launch, this.#rocketLabel, this.#seats);
    this.querySelector("#cancel-form")?.addEventListener("submit", (event: Readonly<Event>) => {
      event.preventDefault();
      this.#submitCancel(String(launch.id));
    });
    this.querySelector("#booking-form")?.addEventListener("submit", (event: Readonly<Event>) => {
      event.preventDefault();
      this.#submitBooking(launch);
    });
  }

  #showError(error: unknown, errorId: string): void {
    const message = error instanceof Error ? error.message : String(error);
    const errorEl = this.querySelector<HTMLElement>(`#${errorId}`);
    if (errorEl) {
      errorEl.textContent = message;
      return;
    }
    this.innerHTML = `<p id="launch-error" role="alert">${escapeHtml(message)}</p>`;
  }

  #submitCancel(launchId: string): void {
    const causeType = this.querySelector<HTMLSelectElement>("#cancel-cause-type")?.value ?? "";
    const causeText =
      this.querySelector<HTMLTextAreaElement>("#cancel-cause-text")?.value.trim() ?? "";
    if (!isCauseType(causeType) || causeText === "") {
      this.#showError("Choose a cause type and describe it.", "cancel-error");
      return;
    }
    cancelLaunch(launchId, { causeText, causeType })
      .then((launch) => {
        this.#show(launch);
      })
      .catch((error: unknown) => {
        this.#showError(error, "cancel-error");
      });
  }

  #fieldValue(id: string): string {
    return this.querySelector<HTMLInputElement>(`#${id}`)?.value.trim() ?? "";
  }

  #submitBooking(launch: Readonly<Launch>): void {
    const name = this.#fieldValue("booking-name");
    const email = this.#fieldValue("booking-email");
    const phone = this.#fieldValue("booking-phone");
    if (name === "" || phone === "" || !email.includes("@")) {
      this.#showError("Enter the passenger name, a valid email and a phone.", "booking-error");
      return;
    }
    const launchId = String(launch.id);
    createBooking(launchId, { email, name, phone })
      .then(() => listBookings(launchId))
      .then((seats) => {
        this.#seats = seats;
        this.#show(launch);
      })
      .catch((error: unknown) => {
        this.#showError(error, "booking-error");
      });
  }
}

customElements.define(tagName, LaunchDetailPage);
