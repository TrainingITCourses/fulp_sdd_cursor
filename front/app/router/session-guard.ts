export const LOGIN_PATH = "/login";

/** Where to send a visitor who opens a fleet page without a session. */
export const redirectTargetWithoutSession = (hasSession: boolean): string | undefined =>
  hasSession ? undefined : LOGIN_PATH;
