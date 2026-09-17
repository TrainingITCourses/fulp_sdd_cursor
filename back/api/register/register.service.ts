import { ApiError } from "../../server/errors.js";
import { insertUser } from "./register.repository.js";
import type { RegisterInput, RegisterResult } from "./register.types.js";

export type { RegisterInput, RegisterResult } from "./register.types.js";

const HTTP_BAD_REQUEST = 400;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const REQUIRED_MESSAGE = "Email, name and password are required";
const INVALID_EMAIL_MESSAGE = "Invalid email format";

const asRecord = (body: unknown): Record<string, unknown> => {
  if (body === null || typeof body !== "object") {
    throw new ApiError(HTTP_BAD_REQUEST, REQUIRED_MESSAGE);
  }
  // Request JSON is an object whose keys are unknown until we read named fields.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return body as Record<string, unknown>;
};

const readTrimmedString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  return trimmed;
};

const readPassword = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  if (value.length === 0) return undefined;
  return value;
};

const assertValidEmail = (email: string): void => {
  if (!EMAIL_PATTERN.test(email)) {
    throw new ApiError(HTTP_BAD_REQUEST, INVALID_EMAIL_MESSAGE);
  }
};

export const parseRegisterInput = (body: unknown): RegisterInput => {
  const record = asRecord(body);
  const email = readTrimmedString(record["email"]);
  const name = readTrimmedString(record["name"]);
  const password = readPassword(record["password"]);
  if (!email || !name || !password) {
    throw new ApiError(HTTP_BAD_REQUEST, REQUIRED_MESSAGE);
  }
  assertValidEmail(email);
  return {
    email: email.toLowerCase(),
    name,
    password,
  };
};

export const registerUser = async (body: unknown): Promise<RegisterResult> => {
  const input = parseRegisterInput(body);
  const passwordHash = await Bun.password.hash(input.password);
  const token = crypto.randomUUID();
  return insertUser({
    email: input.email,
    name: input.name,
    passwordHash,
    token,
  });
};
