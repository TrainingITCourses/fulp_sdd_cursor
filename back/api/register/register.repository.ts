import { getDb } from "../../server/db.js";
import { ApiError } from "../../server/errors.js";
import { coerceToFiniteNumber } from "../../shared/type.utils.js";
import type { NewUserRecord, RegisterResult } from "./register.types.js";

const HTTP_CONFLICT = 409;
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
const INSERT_USER = `
  INSERT INTO users (email, name, password_hash, token, created_at)
  VALUES (?, ?, ?, ?, ?)
`;

export const initRegisterRepository = (): void => {
  getDb().exec(CREATE_USERS);
};

const isUniqueConstraint = (err: unknown): boolean =>
  err instanceof Error && err.message.includes("UNIQUE constraint failed");

const toRegisterResult = (id: number, record: Readonly<NewUserRecord>): RegisterResult => ({
  email: record.email,
  id,
  name: record.name,
  token: record.token,
});

export const insertUser = (record: Readonly<NewUserRecord>): RegisterResult => {
  initRegisterRepository();
  try {
    const result = getDb()
      .prepare(INSERT_USER)
      .run(record.email, record.name, record.passwordHash, record.token, new Date().toISOString());
    const id = coerceToFiniteNumber(result.lastInsertRowid, 0);
    return toRegisterResult(id, record);
  } catch (err) {
    if (isUniqueConstraint(err)) {
      throw new ApiError(HTTP_CONFLICT, "Email already registered");
    }
    throw err;
  }
};
