import "../shared/components/page-header.component.js";

export const tagName = "ab-not-found-page";

class NotFoundPage extends HTMLElement {
  public connectedCallback(): void {
    this.innerHTML = `
      <ab-page-header heading="Page not found"></ab-page-header>
      <p>The route <code>${location.pathname}</code> does not match any page.</p>
      <p><a href="/">← Back home</a></p>`;
  }
}

customElements.define(tagName, NotFoundPage);
