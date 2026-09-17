import "../shared/components/page-header.component.js";
import { login, type LoginInput } from "../shared/repositories/login.repository.js";
import { sessionStore } from "../shared/store/session.store.js";

export const tagName = "ab-login-page";

class LoginPage extends HTMLElement {
  public connectedCallback(): void {
    this.innerHTML = `
      <ab-page-header heading="Login" subtitle="Sign in to Astro-Bookings."></ab-page-header>
      <form id="login-form">
        <label>
          Email
          <input name="email" type="email" autocomplete="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" autocomplete="current-password" required />
        </label>
        <button type="submit">Login</button>
      </form>
      <p id="login-error" role="alert" hidden></p>
      <p id="login-success" hidden></p>`;
    this.querySelector("#login-form")?.addEventListener("submit", (event: Event) => {
      this.#onSubmit(event);
    });
  }

  #readField(data: FormData, name: string): string {
    const value = data.get(name);
    if (typeof value === "string") return value;
    return "";
  }

  #onSubmit(event: Event): void {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement)) return;
    const data = new FormData(form);
    this.#submit({
      email: this.#readField(data, "email"),
      password: this.#readField(data, "password"),
    }).catch(() => {});
  }

  #showError(message: string): void {
    const errorEl = this.querySelector("#login-error");
    const successEl = this.querySelector("#login-success");
    if (successEl instanceof HTMLElement) {
      successEl.hidden = true;
    }
    if (errorEl instanceof HTMLElement) {
      errorEl.hidden = false;
      errorEl.textContent = message;
    }
  }

  #showSuccess(name: string): void {
    const errorEl = this.querySelector("#login-error");
    const successEl = this.querySelector("#login-success");
    if (errorEl instanceof HTMLElement) {
      errorEl.hidden = true;
    }
    if (successEl instanceof HTMLElement) {
      successEl.hidden = false;
      successEl.textContent = `Signed in as ${name}`;
    }
  }

  async #submit(input: Readonly<LoginInput>): Promise<void> {
    try {
      const result = await login(input);
      sessionStore.set({
        token: result.token,
        user: { email: result.email, id: result.id, name: result.name },
      });
      this.#showSuccess(result.name);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      this.#showError(message);
    }
  }
}

customElements.define(tagName, LoginPage);
