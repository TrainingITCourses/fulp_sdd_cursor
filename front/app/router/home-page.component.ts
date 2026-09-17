import "../shared/components/page-header.component.js";
import { appTitle } from "../shared/global.js";

export const tagName = "ab-home-page";

const demoItems = [
  { id: "1", name: "Promt" },
  { id: "2", name: "Context" },
  { id: "3", name: "Harness" },
  { id: "4", name: "Loop" },
];

class HomePage extends HTMLElement {
  public connectedCallback(): void {
    const itemLinks = demoItems
      .map(
        ({ id, name }: Readonly<{ id: string; name: string }>) =>
          `<li><a href="/items/${id}">${name}</a></li>`,
      )
      .join("");
    this.innerHTML = `
      <ab-page-header heading="${appTitle}"></ab-page-header>
      <p>Welcome to Astro-Bookings — book your seat on the next rocket launch.</p>
      <section>
        <h2>Engineering</h2>
        <ul>${itemLinks}</ul>
      </section>`;
  }
}

customElements.define(tagName, HomePage);
