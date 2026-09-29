import { DatabaseSync } from "node:sqlite";

type ClosedStatus = "confirmed" | "successful";

/** Sets a status the public API does not write, so cancellation can be tested. */
export const setLaunchStatus = (launchId: number, status: ClosedStatus): void => {
  const dbPath = process.env["E2E_DB_PATH"];
  if (!dbPath) {
    throw new Error("E2E_DB_PATH is required to set a launch status");
  }
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA busy_timeout = 5000;");
  const result = db.prepare("UPDATE launches SET status = ? WHERE id = ?").run(status, launchId);
  db.close();
  if (result.changes !== 1) {
    throw new Error(`Launch ${launchId} was not updated to ${status}`);
  }
};
