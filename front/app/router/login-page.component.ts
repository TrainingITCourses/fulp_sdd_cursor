import "../shared/components/page-header.component.js";
import { goTo } from "../shared/navigate.js";
import { login, type LoginRequest } from "../shared/repositories/auth.repository.js";
import { authStore } from "../shared/store/auth.store.js";

export const tagName = "ab-login-page";

interface LoginFormFields {
  email: string;
  password: string;
}

class LoginPage extends HTMLElement {
  public connectedCallback(): void {
    const registered = new URLSearchParams(location.search).get("registered") === "1";
    this.innerHTML = `
      <ab-page-header heading="Log in" subtitle="Access your account."></ab-page-header>
      ${registered ? `<p id="register-confirmation">Registration successful. Please log in.</p>` : ""}
      <form id="login-form">
        <label for="login-email">Email</label>
        <input id="login-email" name="email" type="email" autocomplete="email" required />
        <label for="login-password">Password</label>
        <input
          id="login-password"
          name="password"
          type="password"
          autocomplete="current-password"
          required
        />
        <button type="submit">Log in</button>
      </form>
      <p id="login-error" role="alert"></p>`;

    this.querySelector("#login-form")?.addEventListener("submit", (event: Readonly<Event>) => {
      event.preventDefault();
      this.#submit();
    });
  }

  #readFields(form: Readonly<HTMLFormElement>): LoginFormFields {
    return {
      email: form.querySelector<HTMLInputElement>("#login-email")?.value ?? "",
      password: form.querySelector<HTMLInputElement>("#login-password")?.value ?? "",
    };
  }

  #submit(): void {
    const form = this.querySelector<HTMLFormElement>("#login-form");
    const errorEl = this.querySelector<HTMLElement>("#login-error");
    if (!form || !errorEl) return;
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (!button || button.disabled) return;

    errorEl.textContent = "";
    this.#sendLogin(this.#readFields(form), button, errorEl);
  }

  #sendLogin(request: Readonly<LoginRequest>, button: HTMLButtonElement, errorEl: HTMLElement): void {
    button.disabled = true;
    login(request)
      .then((session) => {
        authStore.set(session);
        goTo("/");
      })
      .catch((error: unknown) => {
        errorEl.textContent = error instanceof Error ? error.message : "Login failed.";
      })
      .finally(() => {
        button.disabled = false;
      });
  }
}

customElements.define(tagName, LoginPage);
