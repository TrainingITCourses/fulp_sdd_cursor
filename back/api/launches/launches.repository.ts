import type { StatementResultingChanges } from "node:sqlite";
import { getDb } from "../../server/db.js";
import type {
  CancelLaunchParams,
  InsertLaunchParams,
  LaunchRecord,
  RocketAvailability,
  SessionUser,
} from "./launches.types.js";

interface LaunchRow {
  id: number;
  rocket_id: number;
  scheduled_at: string;
  price_per_passenger: number;
  status: string;
  created_at: string;
  cancellation_cause_type: string | null;
  cancellation_cause_text: string | null;
  cancelled_at: string | null;
  cancelled_by_user_id: number | null;
  cancelled_by_name: string | null;
}

interface RocketRow {
  id: number;
  disabled: number;
}

interface SessionUserRow {
  id: number;
  name: string;
}

interface ColumnInfo {
  name: string;
}

const PLANNED = "planned";
const CANCELLED = "cancelled";

const SELECT_COLUMNS = `launches.id, launches.rocket_id, launches.scheduled_at, launches.price_per_passenger,
  launches.status, launches.created_at, launches.cancellation_cause_type, launches.cancellation_cause_text,
  launches.cancelled_at, launches.cancelled_by_user_id, users.name AS cancelled_by_name`;

const FROM_LAUNCHES = "FROM launches LEFT JOIN users ON users.id = launches.cancelled_by_user_id";

const toLaunchRecord = (row: Readonly<LaunchRow>): LaunchRecord => ({
  cancellationCauseText: row.cancellation_cause_text,
  cancellationCauseType: row.cancellation_cause_type,
  cancelledAt: row.cancelled_at,
  cancelledByName: row.cancelled_by_name,
  cancelledByUserId: row.cancelled_by_user_id,
  createdAt: row.created_at,
  id: row.id,
  pricePerPassenger: row.price_per_passenger,
  rocketId: row.rocket_id,
  scheduledAt: row.scheduled_at,
  status: row.status,
});

const emptyCancellation = {
  cancellationCauseText: null,
  cancellationCauseType: null,
  cancelledAt: null,
  cancelledByName: null,
  cancelledByUserId: null,
};

const columnNames = (): Set<string> => {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const rows = getDb().prepare("PRAGMA table_info(launches)").all() as unknown as ColumnInfo[];
  return new Set(rows.map((row) => row.name));
};

const addColumn = (names: Readonly<Set<string>>, name: string, ddl: string): void => {
  if (names.has(name)) return;
  getDb().exec(ddl);
};

export const initLaunchesRepository = (): void => {
  getDb().exec(`
    CREATE TABLE IF NOT EXISTS launches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rocket_id INTEGER NOT NULL,
      scheduled_at TEXT NOT NULL,
      price_per_passenger REAL NOT NULL CHECK (price_per_passenger > 0),
      status TEXT NOT NULL CHECK (status IN ('planned', 'confirmed', 'successful', 'cancelled')),
      created_at TEXT NOT NULL,
      cancellation_cause_type TEXT,
      cancellation_cause_text TEXT,
      cancelled_at TEXT,
      cancelled_by_user_id INTEGER
    )
  `);
  const names = columnNames();
  addColumn(
    names,
    "cancellation_cause_type",
    "ALTER TABLE launches ADD COLUMN cancellation_cause_type TEXT",
  );
  addColumn(
    names,
    "cancellation_cause_text",
    "ALTER TABLE launches ADD COLUMN cancellation_cause_text TEXT",
  );
  addColumn(names, "cancelled_at", "ALTER TABLE launches ADD COLUMN cancelled_at TEXT");
  addColumn(
    names,
    "cancelled_by_user_id",
    "ALTER TABLE launches ADD COLUMN cancelled_by_user_id INTEGER",
  );
};

export const sessionExists = (token: string): boolean => findSessionUser(token) !== undefined;

export const findSessionUser = (token: string): SessionUser | undefined => {
  const SELECT = `SELECT users.id AS id, users.name AS name
    FROM sessions INNER JOIN users ON users.id = sessions.user_id
    WHERE sessions.token = ?`;
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const row = getDb().prepare(SELECT).get(token) as SessionUserRow | undefined;
  if (!row) return undefined;
  return { id: row.id, name: row.name };
};

export const findRocketAvailability = (rocketId: number): RocketAvailability | undefined => {
  const SELECT = "SELECT id, disabled FROM rockets WHERE id = ?";
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const row = getDb().prepare(SELECT).get(rocketId) as RocketRow | undefined;
  if (!row) return undefined;
  return { disabled: row.disabled === 1, id: row.id };
};

export const insertLaunch = (params: Readonly<InsertLaunchParams>): LaunchRecord => {
  const createdAt = new Date().toISOString();
  const INSERT =
    "INSERT INTO launches (rocket_id, scheduled_at, price_per_passenger, status, created_at) VALUES (?, ?, ?, ?, ?)";
  const result: StatementResultingChanges = getDb()
    .prepare(INSERT)
    .run(params.rocketId, params.scheduledAt, params.pricePerPassenger, PLANNED, createdAt);
  return {
    ...emptyCancellation,
    createdAt,
    id: Number(result.lastInsertRowid),
    pricePerPassenger: params.pricePerPassenger,
    rocketId: params.rocketId,
    scheduledAt: params.scheduledAt,
    status: PLANNED,
  };
};

export const cancelLaunchRecord = (params: Readonly<CancelLaunchParams>): void => {
  const UPDATE = `UPDATE launches
    SET status = ?, cancellation_cause_type = ?, cancellation_cause_text = ?, cancelled_at = ?, cancelled_by_user_id = ?
    WHERE id = ? AND status IN ('planned', 'confirmed')`;
  getDb()
    .prepare(UPDATE)
    .run(
      CANCELLED,
      params.causeType,
      params.causeText,
      params.cancelledAt,
      params.cancelledByUserId,
      params.id,
    );
};

export const listLaunches = (): LaunchRecord[] => {
  const SELECT = `SELECT ${SELECT_COLUMNS} ${FROM_LAUNCHES} ORDER BY launches.scheduled_at ASC, launches.id ASC`;
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const rows = getDb().prepare(SELECT).all() as unknown as LaunchRow[];
  return rows.map((row) => toLaunchRecord(row));
};

export const findLaunchById = (id: number): LaunchRecord | undefined => {
  const SELECT = `SELECT ${SELECT_COLUMNS} ${FROM_LAUNCHES} WHERE launches.id = ?`;
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const row = getDb().prepare(SELECT).get(id) as LaunchRow | undefined;
  return row ? toLaunchRecord(row) : undefined;
};
