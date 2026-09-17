import { menuLinks } from "../../router/routes.js";
import { appTitle } from "../global.js";

export const tagName = "ab-nav-menu";

const getInitialTheme = (): "light" | "dark" => {
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

document.documentElement.dataset["theme"] = getInitialTheme();

/** App nav bar. Override the title with the `title` attribute or change `appTitle` in global.ts. */
class NavMenu extends HTMLElement {
  #setupThemeToggle(): void {
    const toggle = this.querySelector("#theme-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", () => {
      const current = document.documentElement.dataset["theme"];
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.dataset["theme"] = next;
      localStorage.setItem("theme", next);
    });
  }

  #renderMenuItems(): string {
    return (menuLinks as readonly { href: string; label: string }[])
      .map(
        ({ href, label }: Readonly<{ href: string; label: string }>) =>
          `<li><a href="${href}">${label}</a></li>`,
      )
      .join("\n            ");
  }

  public connectedCallback(): void {
    const title = this.getAttribute("title") ?? appTitle;
    const menuItems = this.#renderMenuItems();
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
    this.#setupThemeToggle();
  }
}

customElements.define(tagName, NavMenu);
