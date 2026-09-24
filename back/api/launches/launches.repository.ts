import type { StatementResultingChanges } from "node:sqlite";
import { getDb } from "../../server/db.js";
import type { InsertLaunchParams, LaunchRecord, RocketAvailability } from "./launches.types.js";

interface LaunchRow {
  id: number;
  rocket_id: number;
  scheduled_at: string;
  price_per_passenger: number;
  status: string;
  created_at: string;
}

interface RocketRow {
  id: number;
  disabled: number;
}

const PLANNED = "planned";

const toLaunchRecord = (row: Readonly<LaunchRow>): LaunchRecord => ({
  createdAt: row.created_at,
  id: row.id,
  pricePerPassenger: row.price_per_passenger,
  rocketId: row.rocket_id,
  scheduledAt: row.scheduled_at,
  status: row.status,
});

export const initLaunchesRepository = (): void => {
  getDb().exec(`
    CREATE TABLE IF NOT EXISTS launches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rocket_id INTEGER NOT NULL,
      scheduled_at TEXT NOT NULL,
      price_per_passenger REAL NOT NULL CHECK (price_per_passenger > 0),
      status TEXT NOT NULL CHECK (status IN ('planned', 'confirmed', 'successful', 'cancelled')),
      created_at TEXT NOT NULL
    )
  `);
};

export const sessionExists = (token: string): boolean => {
  const SELECT = "SELECT 1 AS ok FROM sessions WHERE token = ?";
  const row = getDb().prepare(SELECT).get(token);
  return row !== undefined && row !== null;
};

export const findRocketAvailability = (rocketId: number): RocketAvailability | undefined => {
  const SELECT = "SELECT id, disabled FROM rockets WHERE id = ?";
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const row = getDb().prepare(SELECT).get(rocketId) as RocketRow | undefined;
  if (!row) return undefined;
  return { disabled: row.disabled === 1, id: row.id };
};

const SELECT_COLUMNS = "id, rocket_id, scheduled_at, price_per_passenger, status, created_at";

export const insertLaunch = (params: Readonly<InsertLaunchParams>): LaunchRecord => {
  const createdAt = new Date().toISOString();
  const INSERT =
    "INSERT INTO launches (rocket_id, scheduled_at, price_per_passenger, status, created_at) VALUES (?, ?, ?, ?, ?)";
  const result: StatementResultingChanges = getDb()
    .prepare(INSERT)
    .run(params.rocketId, params.scheduledAt, params.pricePerPassenger, PLANNED, createdAt);
  return {
    createdAt,
    id: Number(result.lastInsertRowid),
    pricePerPassenger: params.pricePerPassenger,
    rocketId: params.rocketId,
    scheduledAt: params.scheduledAt,
    status: PLANNED,
  };
};

export const listLaunches = (): LaunchRecord[] => {
  const SELECT = `SELECT ${SELECT_COLUMNS} FROM launches ORDER BY scheduled_at ASC, id ASC`;
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const rows = getDb().prepare(SELECT).all() as unknown as LaunchRow[];
  return rows.map((row) => toLaunchRecord(row));
};

export const findLaunchById = (id: number): LaunchRecord | undefined => {
  const SELECT = `SELECT ${SELECT_COLUMNS} FROM launches WHERE id = ?`;
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const row = getDb().prepare(SELECT).get(id) as LaunchRow | undefined;
  return row ? toLaunchRecord(row) : undefined;
};
