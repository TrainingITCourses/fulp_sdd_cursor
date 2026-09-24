import { escapeHtml } from "../core/escape-html.js";
import "../shared/components/page-header.component.js";

export const tagName = "ab-item-detail-page";

class ItemDetailPage extends HTMLElement {
  public connectedCallback(): void {
    const id = this.getAttribute("item-id") ?? "unknown";
    const safeId = escapeHtml(id);
    this.innerHTML = `
      <ab-page-header heading="Item #${safeId}"></ab-page-header>
      <p>Details for item <mark>${safeId}</mark> — extracted from the URL.</p>
      <p><a href="/">← Back home</a></p>`;
  }
}

customElements.define(tagName, ItemDetailPage);
