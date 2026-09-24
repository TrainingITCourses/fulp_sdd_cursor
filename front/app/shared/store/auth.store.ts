import type { AuthSession } from "../repositories/auth.repository.js";
import { createStore } from "../../core/create-store.js";

/** The logged-in user's session (token + user), persisted across reloads. */
export const authStore = createStore<AuthSession | undefined>("auth", undefined, {
  persist: true,
});
