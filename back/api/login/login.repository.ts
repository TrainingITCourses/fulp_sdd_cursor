import { getDb } from "../../server/db.js";
import { coerceToFiniteNumber } from "../../shared/type.utils.js";
import type { StoredUser, UserProfile } from "./login.types.js";

const CREATE_USERS = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    token TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`;
const SELECT_BY_EMAIL = `
  SELECT id, email, name, password_hash, token
  FROM users
  WHERE email = ?
`;
const SELECT_BY_TOKEN = `
  SELECT id, email, name, password_hash, token
  FROM users
  WHERE token = ?
`;

export const initLoginRepository = (): void => {
  getDb().exec(CREATE_USERS);
};

interface UserRow {
  email: unknown;
  id: unknown;
  name: unknown;
  password_hash: unknown;
  token: unknown;
}

const toStoredUser = (row: Readonly<UserRow> | undefined): StoredUser | undefined => {
  if (!row) return undefined;
  if (typeof row.email !== "string") return undefined;
  if (typeof row.name !== "string") return undefined;
  if (typeof row.password_hash !== "string") return undefined;
  if (typeof row.token !== "string") return undefined;
  return {
    email: row.email,
    id: coerceToFiniteNumber(row.id, 0),
    name: row.name,
    passwordHash: row.password_hash,
    token: row.token,
  };
};

const getUserRow = (sql: string, value: string): UserRow | undefined => {
  initLoginRepository();
  // SQLite row shape is validated in toStoredUser before any field is used.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return getDb().prepare(sql).get(value) as UserRow | undefined;
};

export const findUserByEmail = (email: string): StoredUser | undefined =>
  toStoredUser(getUserRow(SELECT_BY_EMAIL, email));

export const findUserByToken = (token: string): StoredUser | undefined =>
  toStoredUser(getUserRow(SELECT_BY_TOKEN, token));

export const toUserProfile = (user: Readonly<StoredUser>): UserProfile => ({
  email: user.email,
  id: user.id,
  name: user.name,
});
