import { escapeHtml } from "../../core/escape-html.js";
import { menuLinks } from "../../router/routes.js";
import { appTitle } from "../global.js";
import { authStore } from "../store/auth.store.js";

export const tagName = "ab-nav-menu";

const getInitialTheme = (): "light" | "dark" => {
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

document.documentElement.dataset["theme"] = getInitialTheme();

/** App nav bar. Override the title with the `title` attribute or change `displayName` in package.json. */
class NavMenu extends HTMLElement {
  #setupThemeToggle(): void {
    const toggle = this.querySelector<HTMLButtonElement>("#theme-toggle");
    if (!toggle) return;
    toggle.setAttribute(
      "aria-pressed",
      String(document.documentElement.dataset["theme"] === "dark"),
    );
    toggle.addEventListener("click", () => {
      const current = document.documentElement.dataset["theme"];
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.dataset["theme"] = next;
      localStorage.setItem("theme", next);
      toggle.setAttribute("aria-pressed", String(next === "dark"));
    });
  }

  #renderMenuItems(): string {
    return (menuLinks as readonly { href: string; label: string }[])
      .map(
        ({ href, label }: Readonly<{ href: string; label: string }>) =>
          `<li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`,
      )
      .join("\n            ");
  }

  #renderAuthLinks(): string {
    const session = authStore.get();
    if (session) {
      return `<li>${escapeHtml(session.user.name)} (${escapeHtml(session.user.role)})</li>`;
    }
    return `<li><a href="/register">Register</a></li>
            <li><a href="/login">Login</a></li>`;
  }

  #render(): void {
    const title = this.getAttribute("title") ?? appTitle;
    const menuItems = this.#renderMenuItems();
    const authLinks = this.#renderAuthLinks();
    this.innerHTML = `
      <header class="container">
        <nav>
          <ul>
            <li><a href="/"><strong class="logo color">${escapeHtml(title)}</strong></a></li>
          </ul>
          <ul>
            ${menuItems}
            ${authLinks}
            <li>
              <button id="theme-toggle" type="button" aria-label="Toggle theme">
                <span class="light">☼</span>
                <span class="dark">☽</span>
              </button>
            </li>
          </ul>
        </nav>
      </header>`;
    this.#setupThemeToggle();
  }

  public connectedCallback(): void {
    this.#render();
    authStore.subscribe(() => {
      this.#render();
    });
  }
}

customElements.define(tagName, NavMenu);
