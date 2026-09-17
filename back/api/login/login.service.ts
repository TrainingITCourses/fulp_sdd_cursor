import { ApiError } from "../../server/errors.js";
import { findUserByEmail, findUserByToken, toUserProfile } from "./login.repository.js";
import type { LoginInput, LoginResult, UserProfile } from "./login.types.js";

export type { LoginInput, LoginResult, UserProfile } from "./login.types.js";

const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const REQUIRED_MESSAGE = "Email and password are required";
const INVALID_EMAIL_MESSAGE = "Invalid email format";
const INVALID_CREDENTIALS_MESSAGE = "Invalid credentials";
const INVALID_TOKEN_MESSAGE = "Invalid or missing token";
const BEARER_PREFIX = "Bearer ";

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

export const parseLoginInput = (body: unknown): LoginInput => {
  const record = asRecord(body);
  const email = readTrimmedString(record["email"]);
  const password = readPassword(record["password"]);
  if (!email || !password) {
    throw new ApiError(HTTP_BAD_REQUEST, REQUIRED_MESSAGE);
  }
  assertValidEmail(email);
  return {
    email: email.toLowerCase(),
    password,
  };
};

export const parseAccessToken = (authorization: unknown): string => {
  if (typeof authorization !== "string") {
    throw new ApiError(HTTP_UNAUTHORIZED, INVALID_TOKEN_MESSAGE);
  }
  const header = authorization.trim();
  if (!header.toLowerCase().startsWith(BEARER_PREFIX.toLowerCase())) {
    throw new ApiError(HTTP_UNAUTHORIZED, INVALID_TOKEN_MESSAGE);
  }
  const token = header.slice(BEARER_PREFIX.length).trim();
  if (token.length === 0) {
    throw new ApiError(HTTP_UNAUTHORIZED, INVALID_TOKEN_MESSAGE);
  }
  return token;
};

export const loginUser = async (body: unknown): Promise<LoginResult> => {
  const input = parseLoginInput(body);
  const user = findUserByEmail(input.email);
  if (!user) {
    throw new ApiError(HTTP_UNAUTHORIZED, INVALID_CREDENTIALS_MESSAGE);
  }
  const passwordMatches = await Bun.password.verify(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw new ApiError(HTTP_UNAUTHORIZED, INVALID_CREDENTIALS_MESSAGE);
  }
  return {
    email: user.email,
    id: user.id,
    name: user.name,
    token: user.token,
  };
};

export const getCurrentUser = (authorization: unknown): UserProfile => {
  const token = parseAccessToken(authorization);
  const user = findUserByToken(token);
  if (!user) {
    throw new ApiError(HTTP_UNAUTHORIZED, INVALID_TOKEN_MESSAGE);
  }
  return toUserProfile(user);
};
