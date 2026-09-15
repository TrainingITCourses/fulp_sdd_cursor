export const tagName = "ab-page-header";

/** Reusable page heading: <ab-page-header heading="…" subtitle="…"> */
class PageHeader extends HTMLElement {
  public connectedCallback(): void {
    const heading = this.getAttribute("heading") ?? "",
     subtitle = this.getAttribute("subtitle");
    this.innerHTML = `
      <hgroup>
        <h1>${heading}</h1>
        ${subtitle ? `<p>${subtitle}</p>` : ""}
      </hgroup>`;
  }
}

customElements.define(tagName, PageHeader);
