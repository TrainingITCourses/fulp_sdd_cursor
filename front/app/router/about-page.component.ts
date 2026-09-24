import { escapeHtml } from "../core/escape-html.js";
import "../shared/components/page-header.component.js";
import { type AppAuthor, appAuthor } from "../shared/global.js";
import { type HealthStatus, getHealth } from "../shared/repositories/health.repository.js";
import { healthStore } from "../shared/store/health.store.js";

export const tagName = "ab-about-page";

const isWebUrl = (value: string): boolean => /^https?:\/\//iu.test(value);

const renderAuthor = (author: Readonly<AppAuthor> | null): string => {
  if (!author) return "";
  const name = escapeHtml(author.name);
  const nameHtml =
    author.url && isWebUrl(author.url)
      ? `<a href="${escapeHtml(author.url)}" rel="noopener" target="_blank">${name}</a>`
      : name;
  return `<p id="author">Author: ${nameHtml}</p>`;
};

class AboutPage extends HTMLElement {
  public connectedCallback(): void {
    this.innerHTML = `
      <ab-page-header heading="About" subtitle="Just a demo built on web standards only."></ab-page-header>
      <p>Routing via the Navigation API, components as custom elements loaded on demand.</p>
      ${renderAuthor(appAuthor)}
      <p id="health-status">Loading health…</p>`;

    const cached = healthStore.get();
    if (cached) {
      this.#renderHealth(cached);
    }
    // #loadHealth handles its own errors internally; nothing to await here.
    this.#loadHealth().catch(() => {});
  }

  async #loadHealth(): Promise<void> {
    try {
      const health = await getHealth();
      healthStore.set(health);
      this.#renderHealth(health);
    } catch {
      const statusEl = this.querySelector("#health-status");
      if (statusEl) {
        statusEl.textContent = "Health unavailable.";
      }
    }
  }

  #renderHealth({ uptime, runs }: Readonly<HealthStatus>): void {
    const statusEl = this.querySelector("#health-status");
    if (statusEl) {
      statusEl.textContent = `Server up for ${Math.floor(uptime)}s — ${runs} run(s) recorded.`;
    }
  }
}

customElements.define(tagName, AboutPage);
