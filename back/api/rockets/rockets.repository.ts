import type { StatementResultingChanges } from "node:sqlite";
import { getDb } from "../../server/db.js";
import { ApiError } from "../../shared/errors.js";
import { isRecord } from "../../shared/guard.utils.js";
import {
  ROCKET_CAPACITY,
  type InsertRocketParams,
  type RocketRecord,
  type UpdateRocketParams,
} from "./rockets.types.js";

interface RocketRow {
  id: number;
  name: string;
  range: string;
  capacity: number;
  disabled: number;
  created_at: string;
}

const SQLITE_CONSTRAINT_UNIQUE = 2067;

const toRocketRecord = (row: Readonly<RocketRow>): RocketRecord => ({
  capacity: row.capacity,
  createdAt: row.created_at,
  disabled: row.disabled === 1,
  id: row.id,
  name: row.name,
  range: row.range,
});

const isUniqueNameViolation = (error: unknown): boolean => {
  if (!isRecord(error)) return false;
  const { errcode, message } = error;
  return (
    errcode === SQLITE_CONSTRAINT_UNIQUE &&
    typeof message === "string" &&
    message.includes("rockets.name_key")
  );
};

export const initRocketsRepository = (): void => {
  getDb().exec(`
    CREATE TABLE IF NOT EXISTS rockets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_key TEXT NOT NULL UNIQUE,
      range TEXT NOT NULL CHECK (range IN ('earth', 'moon', 'mars')),
      capacity INTEGER NOT NULL DEFAULT 9 CHECK (capacity = 9),
      disabled INTEGER NOT NULL DEFAULT 0 CHECK (disabled IN (0, 1)),
      created_at TEXT NOT NULL
    )
  `);
};

export const sessionExists = (token: string): boolean => {
  const SELECT = "SELECT 1 AS ok FROM sessions WHERE token = ?";
  const row = getDb().prepare(SELECT).get(token);
  return row !== undefined && row !== null;
};

const SELECT_COLUMNS = "id, name, range, capacity, disabled, created_at";

export const insertRocket = (params: Readonly<InsertRocketParams>): RocketRecord => {
  const createdAt = new Date().toISOString();
  const INSERT =
    "INSERT INTO rockets (name, name_key, range, capacity, disabled, created_at) VALUES (?, ?, ?, ?, 0, ?)";
  let result: StatementResultingChanges;
  try {
    result = getDb()
      .prepare(INSERT)
      .run(params.name, params.nameKey, params.range, ROCKET_CAPACITY, createdAt);
  } catch (error) {
    if (isUniqueNameViolation(error)) {
      throw new ApiError(409, "Rocket name already exists");
    }
    throw error;
  }
  return {
    capacity: ROCKET_CAPACITY,
    createdAt,
    disabled: false,
    id: Number(result.lastInsertRowid),
    name: params.name,
    range: params.range,
  };
};

export const listRockets = (): RocketRecord[] => {
  const SELECT = `SELECT ${SELECT_COLUMNS} FROM rockets ORDER BY created_at ASC, id ASC`;
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const rows = getDb().prepare(SELECT).all() as unknown as RocketRow[];
  return rows.map((row) => toRocketRecord(row));
};

export const findRocketById = (id: number): RocketRecord | undefined => {
  const SELECT = `SELECT ${SELECT_COLUMNS} FROM rockets WHERE id = ?`;
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const row = getDb().prepare(SELECT).get(id) as RocketRow | undefined;
  return row ? toRocketRecord(row) : undefined;
};

export const updateRocket = (params: Readonly<UpdateRocketParams>): RocketRecord | undefined => {
  const UPDATE = "UPDATE rockets SET name = ?, name_key = ?, range = ? WHERE id = ?";
  try {
    getDb().prepare(UPDATE).run(params.name, params.nameKey, params.range, params.id);
  } catch (error) {
    if (isUniqueNameViolation(error)) {
      throw new ApiError(409, "Rocket name already exists");
    }
    throw error;
  }
  return findRocketById(params.id);
};

export const disableRocket = (id: number): RocketRecord | undefined => {
  const UPDATE = "UPDATE rockets SET disabled = 1 WHERE id = ? AND disabled = 0";
  getDb().prepare(UPDATE).run(id);
  return findRocketById(id);
};
