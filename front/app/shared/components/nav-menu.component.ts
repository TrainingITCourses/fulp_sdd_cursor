import { menuLinks } from "../../router/routes.js";
import { escapeHtml } from "../escape-html.js";
import { appTitle } from "../global.js";
import { sessionStore, type Session } from "../store/session.store.js";

export const tagName = "ab-nav-menu";

const getInitialTheme = (): "light" | "dark" => {
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

document.documentElement.dataset["theme"] = getInitialTheme();

const isLoginLink = (href: string, session: Session | undefined): boolean =>
  Boolean(session) && href === "/login";

/** App nav bar. Override the title with the `title` attribute or change `appTitle` in global.ts. */
class NavMenu extends HTMLElement {
  #unsubscribe?: () => void;

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

  #sessionItems(session: Session | undefined): string {
    if (!session) return "";
    const name = escapeHtml(session.user.name);
    return `<li><span>${name}</span></li>
            <li><a href="/me">Me</a></li>`;
  }

  #renderMenuItems(session: Session | undefined): string {
    const staticItems = menuLinks
      .filter((link) => !isLoginLink(link.href, session))
      .map(
        ({ href, label }: Readonly<{ href: string; label: string }>) =>
          `<li><a href="${href}">${label}</a></li>`,
      )
      .join("\n            ");
    const sessionItems = this.#sessionItems(session);
    if (!sessionItems) return staticItems;
    return `${staticItems}
            ${sessionItems}`;
  }

  #render(): void {
    const title = this.getAttribute("title") ?? appTitle;
    const menuItems = this.#renderMenuItems(sessionStore.get());
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

  public connectedCallback(): void {
    this.#render();
    this.#unsubscribe = sessionStore.subscribe(() => {
      this.#render();
    });
  }

  public disconnectedCallback(): void {
    this.#unsubscribe?.();
  }
}

customElements.define(tagName, NavMenu);
