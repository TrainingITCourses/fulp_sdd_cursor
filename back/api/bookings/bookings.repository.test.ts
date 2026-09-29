import assert from "node:assert";
import { describe, it } from "node:test";
import { getDb } from "../../server/db.js";
import { initAuthRepository, insertSession, insertUser } from "../auth/auth.repository.js";
import { initLaunchesRepository, insertLaunch } from "../launches/launches.repository.js";
import { initRocketsRepository, insertRocket } from "../rockets/rockets.repository.js";
import {
  findLaunchSeats,
  findSessionUser,
  initBookingsRepository,
  insertBookingIfSeatFree,
  listBookingsByLaunch,
} from "./bookings.repository.js";

initAuthRepository();
initRocketsRepository();
initLaunchesRepository();
initBookingsRepository();

const uniqueName = (label: string): string =>
  `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const userId = (): number =>
  insertUser({
    email: `${uniqueName("user")}@example.com`,
    name: "Ada",
    passwordHash: "hash",
    role: "user",
  }).id;

const launchId = (): number => {
  const name = uniqueName("rocket");
  const rocketId = insertRocket({ name, nameKey: name.toLowerCase(), range: "moon" }).id;
  return insertLaunch({
    pricePerPassenger: 100,
    rocketId,
    scheduledAt: new Date(Date.now() + 86_400_000).toISOString(),
  }).id;
};

const params = (id: number, bookedByUserId: number, createdAt: string) => ({
  bookedByUserId,
  createdAt,
  email: "ada@example.com",
  launchId: id,
  name: "Ada",
  phone: "+34 600 000 000",
});

void describe("bookings repository", () => {
  void it("reads capacity 9 and zero taken seats for a new launch", () => {
    const id = launchId();

    assert.deepStrictEqual(findLaunchSeats(id), { capacity: 9, id, status: "planned", taken: 0 });
    assert.strictEqual(findLaunchSeats(9_999_999), undefined);
  });

  void it("inserts bookings and lists them ordered by created_at", () => {
    const id = launchId();
    const user = userId();
    const later = insertBookingIfSeatFree(params(id, user, "2026-09-29T18:00:00.000Z"));
    const sooner = insertBookingIfSeatFree(params(id, user, "2026-09-29T17:00:00.000Z"));

    assert.ok(later && later.id > 0);
    assert.strictEqual(later.launchId, id);
    assert.deepStrictEqual(
      listBookingsByLaunch(id).map((booking) => booking.id),
      [sooner?.id, later.id],
    );
    assert.strictEqual(findLaunchSeats(id)?.taken, 2);
    const stored = getDb()
      .prepare("SELECT booked_by_user_id FROM bookings WHERE id = ?")
      .get(later.id) as { booked_by_user_id: number };
    assert.strictEqual(stored.booked_by_user_id, user);
  });

  void it("stores nothing once the launch is full", () => {
    const id = launchId();
    const user = userId();
    for (let seat = 0; seat < 9; seat += 1) {
      assert.ok(insertBookingIfSeatFree(params(id, user, new Date().toISOString())));
    }

    assert.strictEqual(
      insertBookingIfSeatFree(params(id, user, new Date().toISOString())),
      undefined,
    );
    assert.strictEqual(listBookingsByLaunch(id).length, 9);
  });

  void it("stores nothing when the launch is not planned or does not exist", () => {
    const id = launchId();
    const user = userId();
    getDb().prepare("UPDATE launches SET status = 'confirmed' WHERE id = ?").run(id);

    assert.strictEqual(
      insertBookingIfSeatFree(params(id, user, new Date().toISOString())),
      undefined,
    );
    assert.strictEqual(
      insertBookingIfSeatFree(params(9_999_999, user, new Date().toISOString())),
      undefined,
    );
    assert.strictEqual(listBookingsByLaunch(id).length, 0);
  });

  void it("finds the session user id by token", () => {
    const user = userId();
    const token = crypto.randomUUID();
    insertSession({ token, userId: user });

    assert.deepStrictEqual(findSessionUser(token), { id: user });
    assert.strictEqual(findSessionUser("missing-token"), undefined);
  });
});
