/** Narrows an untrusted response body to `{ error: string }`, with no type assertion. */
export const isErrorBody = (body: unknown): body is { error: string } =>
  typeof body === "object" && body !== null && "error" in body && typeof body.error === "string";
