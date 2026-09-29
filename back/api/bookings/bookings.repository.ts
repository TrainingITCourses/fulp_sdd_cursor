import type { StatementResultingChanges } from "node:sqlite";
import { getDb } from "../../server/db.js";
import type { Booking, InsertBookingParams, LaunchSeats, SessionUser } from "./bookings.types.js";

interface BookingRow {
  id: number;
  launch_id: number;
  passenger_name: string;
  passenger_email: string;
  passenger_phone: string;
  created_at: string;
}

interface LaunchSeatsRow {
  id: number;
  status: string;
  capacity: number;
  taken: number;
}

interface SessionUserRow {
  id: number;
}

const toBooking = (row: Readonly<BookingRow>): Booking => ({
  createdAt: row.created_at,
  email: row.passenger_email,
  id: row.id,
  launchId: row.launch_id,
  name: row.passenger_name,
  phone: row.passenger_phone,
});

export const initBookingsRepository = (): void => {
  getDb().exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      launch_id INTEGER NOT NULL,
      passenger_name TEXT NOT NULL,
      passenger_email TEXT NOT NULL,
      passenger_phone TEXT NOT NULL,
      booked_by_user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
  getDb().exec("CREATE INDEX IF NOT EXISTS bookings_launch_id ON bookings (launch_id)");
};

export const findSessionUser = (token: string): SessionUser | undefined => {
  const SELECT = "SELECT user_id AS id FROM sessions WHERE token = ?";
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const row = getDb().prepare(SELECT).get(token) as SessionUserRow | undefined;
  return row ? { id: row.id } : undefined;
};

export const findLaunchSeats = (launchId: number): LaunchSeats | undefined => {
  const SELECT = `SELECT launches.id AS id, launches.status AS status, rockets.capacity AS capacity,
    (SELECT COUNT(*) FROM bookings WHERE bookings.launch_id = launches.id) AS taken
    FROM launches INNER JOIN rockets ON rockets.id = launches.rocket_id
    WHERE launches.id = ?`;
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const row = getDb().prepare(SELECT).get(launchId) as LaunchSeatsRow | undefined;
  if (!row) return undefined;
  return { capacity: row.capacity, id: row.id, status: row.status, taken: row.taken };
};

/**
 * Counts and inserts in one statement, so a booking is only stored while the
 * launch is planned and has a free seat. Returns undefined when nothing is stored.
 */
export const insertBookingIfSeatFree = (
  params: Readonly<InsertBookingParams>,
): Booking | undefined => {
  const INSERT = `INSERT INTO bookings
    (launch_id, passenger_name, passenger_email, passenger_phone, booked_by_user_id, created_at)
    SELECT launches.id, ?, ?, ?, ?, ?
    FROM launches INNER JOIN rockets ON rockets.id = launches.rocket_id
    WHERE launches.id = ? AND launches.status = 'planned'
      AND (SELECT COUNT(*) FROM bookings WHERE bookings.launch_id = launches.id) < rockets.capacity`;
  const result: StatementResultingChanges = getDb()
    .prepare(INSERT)
    .run(
      params.name,
      params.email,
      params.phone,
      params.bookedByUserId,
      params.createdAt,
      params.launchId,
    );
  if (Number(result.changes) === 0) return undefined;
  return {
    createdAt: params.createdAt,
    email: params.email,
    id: Number(result.lastInsertRowid),
    launchId: params.launchId,
    name: params.name,
    phone: params.phone,
  };
};

/**
 * Deletes in one statement, so a booking is only removed while its launch is
 * planned. Returns false when nothing is deleted.
 */
export const deleteBookingIfPlanned = (launchId: number, bookingId: number): boolean => {
  const DELETE = `DELETE FROM bookings
    WHERE id = ? AND launch_id = ?
      AND EXISTS (SELECT 1 FROM launches WHERE launches.id = ? AND launches.status = 'planned')`;
  const result: StatementResultingChanges = getDb()
    .prepare(DELETE)
    .run(bookingId, launchId, launchId);
  return Number(result.changes) > 0;
};

export const listBookingsByLaunch = (launchId: number): Booking[] => {
  const SELECT = `SELECT id, launch_id, passenger_name, passenger_email, passenger_phone, created_at
    FROM bookings WHERE launch_id = ? ORDER BY created_at ASC, id ASC`;
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const rows = getDb().prepare(SELECT).all(launchId) as unknown as BookingRow[];
  return rows.map((row) => toBooking(row));
};
