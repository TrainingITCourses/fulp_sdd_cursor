import assert from "node:assert";
import { describe, it } from "node:test";
import { getDb } from "../../server/db.js";
import { insertSession, insertUser } from "../auth/auth.repository.js";
import { startAuthTracking } from "../auth/auth.service.js";
import { insertLaunch } from "../launches/launches.repository.js";
import { startLaunchesTracking } from "../launches/launches.service.js";
import { insertRocket } from "../rockets/rockets.repository.js";
import { startRocketsTracking } from "../rockets/rockets.service.js";
import { createBooking, listBookings, startBookingsTracking } from "./bookings.service.js";

const BAD_REQUEST = 400;
const UNAUTHORIZED = 401;
const NOT_FOUND = 404;
const CONFLICT = 409;

startAuthTracking();
startRocketsTracking();
startLaunchesTracking();
startBookingsTracking();

const uniqueName = (label: string): string =>
  `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const bearer = (): { authorization: string; userId: number } => {
  const user = insertUser({
    email: `${uniqueName("user")}@example.com`,
    name: "Ada",
    passwordHash: "hash",
    role: "user",
  });
  const token = crypto.randomUUID();
  insertSession({ token, userId: user.id });
  return { authorization: `Bearer ${token}`, userId: user.id };
};

const plannedLaunchId = (): number => {
  const name = uniqueName("rocket");
  const rocketId = insertRocket({ name, nameKey: name.toLowerCase(), range: "mars" }).id;
  return insertLaunch({
    pricePerPassenger: 100,
    rocketId,
    scheduledAt: new Date(Date.now() + 86_400_000).toISOString(),
  }).id;
};

const passenger = { email: "ada@example.com", name: "Ada", phone: "+34 600 000 000" };

const statusOf = (error: unknown): number | undefined =>
  error instanceof Error && "status" in error ? (error as { status: number }).status : undefined;

void describe("bookings service", () => {
  void it("creates a booking with trimmed data and an ISO 8601 time from the server", () => {
    const session = bearer();
    const launchId = plannedLaunchId();

    const booking = createBooking(
      launchId,
      { email: "  ada@example.com ", name: "  Ada  ", phone: " 600 " },
      session.authorization,
    );

    assert.ok(booking.id > 0);
    assert.strictEqual(booking.launchId, launchId);
    assert.strictEqual(booking.name, "Ada");
    assert.strictEqual(booking.email, "ada@example.com");
    assert.strictEqual(booking.phone, "600");
    assert.match(booking.createdAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    const stored = getDb()
      .prepare("SELECT booked_by_user_id FROM bookings WHERE id = ?")
      .get(booking.id) as { booked_by_user_id: number };
    assert.strictEqual(stored.booked_by_user_id, session.userId);
  });

  void it("lists an empty launch with 0 taken and 9 free", () => {
    const summary = listBookings(plannedLaunchId(), bearer().authorization);

    assert.deepStrictEqual(summary, { bookings: [], capacity: 9, free: 9, taken: 0 });
  });

  void it("lists passengers in booking order with taken and free seats", () => {
    const auth = bearer().authorization;
    const launchId = plannedLaunchId();
    const first = createBooking(launchId, passenger, auth);
    const second = createBooking(launchId, { ...passenger, name: "Grace" }, auth);

    const summary = listBookings(launchId, auth);

    assert.strictEqual(summary.capacity, 9);
    assert.strictEqual(summary.taken, 2);
    assert.strictEqual(summary.free, 7);
    assert.deepStrictEqual(summary.bookings, [first, second]);
  });

  void it("rejects empty fields and an email without @ with 400", () => {
    const auth = bearer().authorization;
    const launchId = plannedLaunchId();

    for (const body of [
      { ...passenger, name: "   " },
      { ...passenger, email: "  " },
      { ...passenger, phone: "" },
      { ...passenger, email: "ada.example.com" },
      { email: passenger.email, name: passenger.name },
      undefined,
    ]) {
      assert.throws(
        () => createBooking(launchId, body, auth),
        (error: unknown) => statusOf(error) === BAD_REQUEST,
      );
    }
    assert.strictEqual(listBookings(launchId, auth).taken, 0);
  });

  void it("rejects an id, a time, a user or a launch id in the body with 400", () => {
    const auth = bearer().authorization;
    const launchId = plannedLaunchId();

    for (const extra of [
      { id: 1 },
      { createdAt: "2026-09-29T16:00:00.000Z" },
      { userId: 1 },
      { bookedBy: 1 },
      { bookedByUserId: 1 },
      { launchId },
    ]) {
      assert.throws(
        () => createBooking(launchId, { ...passenger, ...extra }, auth),
        (error: unknown) => statusOf(error) === BAD_REQUEST,
      );
    }
    assert.strictEqual(listBookings(launchId, auth).taken, 0);
  });

  void it("rejects an unknown launch with 404 on create and list", () => {
    const auth = bearer().authorization;

    assert.throws(
      () => createBooking(9_999_999, passenger, auth),
      (error: unknown) => statusOf(error) === NOT_FOUND,
    );
    assert.throws(
      () => listBookings(9_999_999, auth),
      (error: unknown) => statusOf(error) === NOT_FOUND,
    );
  });

  void it("rejects a launch that is not planned with 409", () => {
    const auth = bearer().authorization;
    for (const status of ["confirmed", "successful", "cancelled"]) {
      const launchId = plannedLaunchId();
      getDb().prepare("UPDATE launches SET status = ? WHERE id = ?").run(status, launchId);

      assert.throws(
        () => createBooking(launchId, passenger, auth),
        (error: unknown) => statusOf(error) === CONFLICT,
      );
      assert.strictEqual(listBookings(launchId, auth).taken, 0);
    }
  });

  void it("rejects booking number 10 with 409 and keeps 9 bookings", () => {
    const auth = bearer().authorization;
    const launchId = plannedLaunchId();
    for (let seat = 0; seat < 9; seat += 1) {
      createBooking(launchId, passenger, auth);
    }

    assert.throws(
      () => createBooking(launchId, passenger, auth),
      (error: unknown) => statusOf(error) === CONFLICT,
    );
    const summary = listBookings(launchId, auth);
    assert.strictEqual(summary.taken, 9);
    assert.strictEqual(summary.free, 0);
  });

  void it("rejects create and list without a valid session with 401", () => {
    const launchId = plannedLaunchId();

    for (const authorization of [undefined, "", "Bearer missing", "Token abc"]) {
      assert.throws(
        () => createBooking(launchId, passenger, authorization),
        (error: unknown) => statusOf(error) === UNAUTHORIZED,
      );
      assert.throws(
        () => listBookings(launchId, authorization),
        (error: unknown) => statusOf(error) === UNAUTHORIZED,
      );
    }
    assert.strictEqual(listBookings(launchId, bearer().authorization).taken, 0);
  });
});
