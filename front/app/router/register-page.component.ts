import "../shared/components/page-header.component.js";
import { goTo } from "../shared/navigate.js";
import { register, type RegisterRequest } from "../shared/repositories/auth.repository.js";

export const tagName = "ab-register-page";

interface RegisterFormFields {
  email: string;
  name: string;
  password: string;
}

class RegisterPage extends HTMLElement {
  public connectedCallback(): void {
    this.innerHTML = `
      <ab-page-header heading="Register" subtitle="Create your account."></ab-page-header>
      <form id="register-form">
        <label for="register-email">Email</label>
        <input id="register-email" name="email" type="email" autocomplete="email" required />
        <label for="register-name">Name</label>
        <input id="register-name" name="name" type="text" autocomplete="name" required />
        <label for="register-password">Password</label>
        <input
          id="register-password"
          name="password"
          type="password"
          autocomplete="new-password"
          required
        />
        <button type="submit">Register</button>
      </form>
      <p id="register-error" role="alert"></p>`;

    this.querySelector("#register-form")?.addEventListener("submit", (event: Readonly<Event>) => {
      event.preventDefault();
      this.#submit();
    });
  }

  #readFields(form: Readonly<HTMLFormElement>): RegisterFormFields {
    return {
      email: form.querySelector<HTMLInputElement>("#register-email")?.value ?? "",
      name: form.querySelector<HTMLInputElement>("#register-name")?.value ?? "",
      password: form.querySelector<HTMLInputElement>("#register-password")?.value ?? "",
    };
  }

  #submit(): void {
    const form = this.querySelector<HTMLFormElement>("#register-form");
    const errorEl = this.querySelector<HTMLElement>("#register-error");
    if (!form || !errorEl) return;
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (!button || button.disabled) return;

    errorEl.textContent = "";
    this.#sendRegister(this.#readFields(form), button, errorEl);
  }

  #sendRegister(
    request: Readonly<RegisterRequest>,
    button: HTMLButtonElement,
    errorEl: HTMLElement,
  ): void {
    button.disabled = true;
    register(request)
      .then(() => {
        goTo("/login?registered=1");
      })
      .catch((error: unknown) => {
        errorEl.textContent = error instanceof Error ? error.message : "Registration failed.";
      })
      .finally(() => {
        button.disabled = false;
      });
  }
}

customElements.define(tagName, RegisterPage);
