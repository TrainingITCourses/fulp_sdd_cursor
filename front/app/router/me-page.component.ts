import "../shared/components/page-header.component.js";
import { escapeHtml } from "../shared/escape-html.js";
import { getMe, type UserProfile } from "../shared/repositories/me.repository.js";
import { sessionStore } from "../shared/store/session.store.js";

export const tagName = "ab-me-page";

const MISSING_TOKEN_MESSAGE = "Invalid or missing token";

class MePage extends HTMLElement {
  public connectedCallback(): void {
    this.innerHTML = `
      <ab-page-header heading="My profile" subtitle="Your Astro-Bookings account."></ab-page-header>
      <p id="me-error" role="alert" hidden></p>
      <dl id="me-profile" hidden></dl>`;
    this.#load().catch(() => {});
  }

  #showError(message: string): void {
    const errorEl = this.querySelector("#me-error");
    const profileEl = this.querySelector("#me-profile");
    if (profileEl instanceof HTMLElement) {
      profileEl.hidden = true;
      profileEl.replaceChildren();
    }
    if (errorEl instanceof HTMLElement) {
      errorEl.hidden = false;
      errorEl.textContent = message;
    }
  }

  #showProfile(profile: Readonly<UserProfile>): void {
    const errorEl = this.querySelector("#me-error");
    const profileEl = this.querySelector("#me-profile");
    if (errorEl instanceof HTMLElement) {
      errorEl.hidden = true;
    }
    if (profileEl instanceof HTMLElement) {
      profileEl.hidden = false;
      profileEl.innerHTML = `
        <dt>Id</dt>
        <dd>${escapeHtml(String(profile.id))}</dd>
        <dt>Email</dt>
        <dd>${escapeHtml(profile.email)}</dd>
        <dt>Name</dt>
        <dd>${escapeHtml(profile.name)}</dd>`;
    }
  }

  async #load(): Promise<void> {
    const session = sessionStore.get();
    if (!session) {
      this.#showError(MISSING_TOKEN_MESSAGE);
      return;
    }
    try {
      const profile = await getMe(session.token);
      this.#showProfile(profile);
    } catch (err) {
      const message = err instanceof Error ? err.message : MISSING_TOKEN_MESSAGE;
      this.#showError(message);
    }
  }
}

customElements.define(tagName, MePage);
