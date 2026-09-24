export const tagName = "ab-page-header";

/** Reusable page heading: <ab-page-header heading="…" subtitle="…"> */
class PageHeader extends HTMLElement {
  public connectedCallback(): void {
    const heading = this.getAttribute("heading") ?? "";
    const subtitle = this.getAttribute("subtitle");
    this.innerHTML = `
      <hgroup>
        <h1>${escapeHtml(heading)}</h1>
        ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
      </hgroup>`;
  }
}

customElements.define(tagName, PageHeader);
import { escapeHtml } from "../../core/escape-html.js";
