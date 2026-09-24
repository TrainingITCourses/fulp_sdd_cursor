import { escapeHtml } from "../core/escape-html.js";
import "../shared/components/page-header.component.js";
import { appTitle } from "../shared/global.js";

export const tagName = "ab-home-page";

const demoItems = [
  { id: "1", name: "A web app with no more than standards" },
  { id: "2", name: "A backend API based on Express" },
  { id: "3", name: "A bun/node CLI" },
  { id: "4", name: "End to end tested with Playwright" },
];

class HomePage extends HTMLElement {
  public connectedCallback(): void {
    const itemLinks = demoItems
      .map(
        ({ id, name }: Readonly<{ id: string; name: string }>) =>
          `<li><a href="/items/${escapeHtml(id)}">${escapeHtml(name)}</a></li>`,
      )
      .join("");
    this.innerHTML = `
      <ab-page-header heading="${escapeHtml(appTitle)}"></ab-page-header>
      <h3>Build software you can trust with AIDDbot</h3>
      <section>
        <h2>Archetypes</h2>
        <ul>${itemLinks}</ul>
      </section>
      <section>
        <p>You can safely remove this content and start coding your dreams.</p>
      </section>
      `;
  }
}

customElements.define(tagName, HomePage);
