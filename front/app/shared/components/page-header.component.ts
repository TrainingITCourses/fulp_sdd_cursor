import { escapeHtml } from "../escape-html.js";

export const tagName = "ab-page-header";

/** Reusable page heading: <ab-page-header heading="…" subtitle="…"> */
class PageHeader extends HTMLElement {
  public connectedCallback(): void {
    const heading = escapeHtml(this.getAttribute("heading") ?? "");
    const subtitle = this.getAttribute("subtitle");
    this.innerHTML = `
      <hgroup>
        <h1>${heading}</h1>
        ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
      </hgroup>`;
  }
}

customElements.define(tagName, PageHeader);
