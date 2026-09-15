import { menuLinks } from "../../router/routes.js";
import { appTitle } from "../global.js";

export const tagName = "ab-nav-menu";

function getInitialTheme(): "light" | "dark" {
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

document.documentElement.dataset["theme"] = getInitialTheme();

/** App nav bar. Override the title with the `title` attribute or change `appTitle` in app-title.ts. */
class NavMenu extends HTMLElement {
  public connectedCallback(): void {
    const title = this.getAttribute("title") ?? appTitle,
      menuItems = menuLinks
        .map(({ href, label }) => `<li><a href="${href}">${label}</a></li>`)
        .join("\n            ");
    this.innerHTML = `
      <header class="container">
        <nav>
          <ul>
            <li><a href="/"><strong class="logo color">${title}</strong></a></li>
          </ul>
          <ul>
            ${menuItems}
            <li>
              <span id="theme-toggle" aria-label="Toggle theme">
                <span class="light">☼</span>
                <span class="dark">☽</span>
              </span>
            </li>
          </ul>
        </nav>
      </header>`;

    this.querySelector("#theme-toggle")?.addEventListener("click", () => {
      const current = document.documentElement.dataset["theme"],
        next = current === "dark" ? "light" : "dark";
      document.documentElement.dataset["theme"] = next;
      localStorage.setItem("theme", next);
    });
  }
}

customElements.define(tagName, NavMenu);
