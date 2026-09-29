import { DatabaseSync } from "node:sqlite";

const openDb = (): DatabaseSync => {
  const dbPath = process.env["E2E_DB_PATH"];
  if (!dbPath) {
    throw new Error("E2E_DB_PATH is required to read the bookings table");
  }
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA busy_timeout = 5000;");
  return db;
};

/** Lists the columns of the bookings table, which the public API does not expose. */
export const bookingColumns = (): string[] => {
  const db = openDb();
  const rows = db.prepare("PRAGMA table_info(bookings)").all() as { name: string }[];
  db.close();
  return rows.map((row) => row.name).toSorted();
};

/** Tells whether a bookings row is still stored, whatever the API returns. */
export const bookingRowExists = (bookingId: number): boolean => {
  const db = openDb();
  const row = db.prepare("SELECT id FROM bookings WHERE id = ?").get(bookingId);
  db.close();
  return row !== undefined;
};
