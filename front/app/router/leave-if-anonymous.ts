import { goTo } from "../shared/navigate.js";
import { authStore } from "../shared/store/auth.store.js";
import { redirectTargetWithoutSession } from "./session-guard.js";

/** Leaves the fleet page when nobody is logged in. Returns true when it redirected. */
export const leaveIfAnonymous = (): boolean => {
  const target = redirectTargetWithoutSession(authStore.get() !== undefined);
  if (!target) return false;
  goTo(target);
  return true;
};
