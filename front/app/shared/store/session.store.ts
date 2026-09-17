import { createStore } from "../../core/create-store.js";

export interface SessionUser {
  email: string;
  id: number;
  name: string;
}

export interface Session {
  token: string;
  user: SessionUser;
}

/** Authenticated session after register or login; token is persisted for later requests. */
export const sessionStore = createStore<Session | undefined>("session", undefined, {
  persist: true,
});
