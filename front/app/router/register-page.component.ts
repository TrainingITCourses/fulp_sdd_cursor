import "../shared/components/page-header.component.js";
import { register, type RegisterInput } from "../shared/repositories/register.repository.js";
import { sessionStore } from "../shared/store/session.store.js";

export const tagName = "ab-register-page";

class RegisterPage extends HTMLElement {
  public connectedCallback(): void {
    this.innerHTML = `
      <ab-page-header heading="Register" subtitle="Create your Astro-Bookings account."></ab-page-header>
      <form id="register-form">
        <label>
          Email
          <input name="email" type="email" autocomplete="email" required />
        </label>
        <label>
          Name
          <input name="name" type="text" autocomplete="name" required />
        </label>
        <label>
          Password
          <input name="password" type="password" autocomplete="new-password" required />
        </label>
        <button type="submit">Register</button>
      </form>
      <p id="register-error" role="alert" hidden></p>
      <p id="register-success" hidden></p>`;
    this.querySelector("#register-form")?.addEventListener("submit", (event: Event) => {
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
      name: this.#readField(data, "name"),
      password: this.#readField(data, "password"),
    }).catch(() => {});
  }

  #showError(message: string): void {
    const errorEl = this.querySelector("#register-error");
    const successEl = this.querySelector("#register-success");
    if (successEl instanceof HTMLElement) {
      successEl.hidden = true;
    }
    if (errorEl instanceof HTMLElement) {
      errorEl.hidden = false;
      errorEl.textContent = message;
    }
  }

  #showSuccess(name: string): void {
    const errorEl = this.querySelector("#register-error");
    const successEl = this.querySelector("#register-success");
    if (errorEl instanceof HTMLElement) {
      errorEl.hidden = true;
    }
    if (successEl instanceof HTMLElement) {
      successEl.hidden = false;
      successEl.textContent = `Registered as ${name}`;
    }
  }

  async #submit(input: Readonly<RegisterInput>): Promise<void> {
    try {
      const result = await register(input);
      sessionStore.set({
        token: result.token,
        user: { email: result.email, id: result.id, name: result.name },
      });
      this.#showSuccess(result.name);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      this.#showError(message);
    }
  }
}

customElements.define(tagName, RegisterPage);
