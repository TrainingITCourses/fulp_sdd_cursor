import assert from "node:assert";
import { describe, it } from "node:test";
import { getDb } from "../../server/db.js";
import { insertSession, insertUser } from "../auth/auth.repository.js";
import { startAuthTracking } from "../auth/auth.service.js";
import { disableRocket, insertRocket } from "../rockets/rockets.repository.js";
import { startRocketsTracking } from "../rockets/rockets.service.js";
import {
  cancelLaunch,
  createLaunch,
  getLaunch,
  listLaunches,
  startLaunchesTracking,
} from "./launches.service.js";

const BAD_REQUEST = 400;
const UNAUTHORIZED = 401;
const NOT_FOUND = 404;
const CONFLICT = 409;

startAuthTracking();
startRocketsTracking();
startLaunchesTracking();

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

const futureIso = (): string => new Date(Date.now() + 86_400_000).toISOString();

const activeRocketId = (): number => {
  const name = uniqueName("rocket");
  return insertRocket({ name, nameKey: name.toLowerCase(), range: "moon" }).id;
};

const statusOf = (error: unknown): number | undefined =>
  error instanceof Error && "status" in error ? (error as { status: number }).status : undefined;

void describe("launches service", () => {
  void it("creates a planned launch for a future date and a positive price", () => {
    const auth = bearer().authorization;
    const scheduledAt = futureIso();
    const launch = createLaunch(
      { pricePerPassenger: 2500, rocketId: activeRocketId(), scheduledAt },
      auth,
    );

    assert.strictEqual(launch.status, "planned");
    assert.strictEqual(launch.scheduledAt, scheduledAt);
    assert.strictEqual(launch.pricePerPassenger, 2500);
    assert.strictEqual(launch.cancellation, null);
    assert.ok(launch.createdAt);
  });

  void it("rejects a missing rocket, a bad date, a bad price, and a status field with 400", () => {
    const auth = bearer().authorization;
    const rocketId = activeRocketId();
    const scheduledAt = futureIso();

    assert.throws(
      () => createLaunch({ pricePerPassenger: 10, scheduledAt }, auth),
      (error: unknown) => statusOf(error) === BAD_REQUEST,
    );
    assert.throws(
      () => createLaunch({ pricePerPassenger: 10, rocketId, scheduledAt: "tomorrow" }, auth),
      (error: unknown) => statusOf(error) === BAD_REQUEST,
    );
    assert.throws(
      () =>
        createLaunch(
          {
            pricePerPassenger: 10,
            rocketId,
            scheduledAt: new Date(Date.now() - 86_400_000).toISOString(),
          },
          auth,
        ),
      (error: unknown) => statusOf(error) === BAD_REQUEST,
    );
    assert.throws(
      () => createLaunch({ pricePerPassenger: 0, rocketId, scheduledAt }, auth),
      (error: unknown) => statusOf(error) === BAD_REQUEST,
    );
    assert.throws(
      () => createLaunch({ pricePerPassenger: "10", rocketId, scheduledAt }, auth),
      (error: unknown) => statusOf(error) === BAD_REQUEST,
    );
    assert.throws(
      () => createLaunch({ pricePerPassenger: 10, rocketId, scheduledAt, status: "planned" }, auth),
      (error: unknown) => statusOf(error) === BAD_REQUEST,
    );
  });

  void it("rejects an unknown rocket with 404 and a disabled rocket with 409", () => {
    const auth = bearer().authorization;
    const scheduledAt = futureIso();
    const disabled = activeRocketId();
    disableRocket(disabled);

    assert.throws(
      () => createLaunch({ pricePerPassenger: 10, rocketId: 9_999_999, scheduledAt }, auth),
      (error: unknown) => statusOf(error) === NOT_FOUND,
    );
    assert.throws(
      () => createLaunch({ pricePerPassenger: 10, rocketId: disabled, scheduledAt }, auth),
      (error: unknown) => statusOf(error) === CONFLICT,
    );
  });

  void it("rejects create, list, and detail without a valid session with 401", () => {
    assert.throws(
      () =>
        createLaunch({ pricePerPassenger: 10, rocketId: 1, scheduledAt: futureIso() }, undefined),
      (error: unknown) => statusOf(error) === UNAUTHORIZED,
    );
    assert.throws(
      () => listLaunches("Bearer missing"),
      (error: unknown) => statusOf(error) === UNAUTHORIZED,
    );
    assert.throws(
      () => getLaunch(1, "Bearer missing"),
      (error: unknown) => statusOf(error) === UNAUTHORIZED,
    );
  });

  void it("lists launches by date and returns an existing launch", () => {
    const auth = bearer().authorization;
    const later = createLaunch(
      {
        pricePerPassenger: 30,
        rocketId: activeRocketId(),
        scheduledAt: new Date(Date.now() + 200_000_000).toISOString(),
      },
      auth,
    );
    const sooner = createLaunch(
      {
        pricePerPassenger: 40,
        rocketId: activeRocketId(),
        scheduledAt: new Date(Date.now() + 100_000_000).toISOString(),
      },
      auth,
    );

    const ids = listLaunches(auth).map((launch) => launch.id);
    assert.ok(ids.indexOf(sooner.id) < ids.indexOf(later.id));
    assert.strictEqual(getLaunch(sooner.id, auth).status, "planned");
    assert.strictEqual(getLaunch(sooner.id, auth).rocketId, sooner.rocketId);
    assert.strictEqual(getLaunch(sooner.id, auth).cancellation, null);
  });

  void it("rejects an unknown launch id with 404", () => {
    assert.throws(
      () => getLaunch(9_999_999, bearer().authorization),
      (error: unknown) => statusOf(error) === NOT_FOUND,
    );
  });

  void it("cancels a planned or confirmed launch and returns the session user", () => {
    const session = bearer();
    const planned = createLaunch(
      { pricePerPassenger: 10, rocketId: activeRocketId(), scheduledAt: futureIso() },
      session.authorization,
    );
    const confirmed = createLaunch(
      { pricePerPassenger: 11, rocketId: activeRocketId(), scheduledAt: futureIso() },
      session.authorization,
    );
    getDb().prepare("UPDATE launches SET status = 'confirmed' WHERE id = ?").run(confirmed.id);

    const cancelled = cancelLaunch(
      planned.id,
      { causeText: "  Valve leak  ", causeType: "technical" },
      session.authorization,
    );
    const also = cancelLaunch(
      confirmed.id,
      { causeText: "Budget cut", causeType: "economic" },
      session.authorization,
    );

    assert.strictEqual(cancelled.status, "cancelled");
    assert.strictEqual(cancelled.cancellation?.causeType, "technical");
    assert.strictEqual(cancelled.cancellation?.causeText, "Valve leak");
    assert.strictEqual(cancelled.cancellation?.cancelledBy.id, session.userId);
    assert.strictEqual(cancelled.cancellation?.cancelledBy.name, "Ada");
    assert.match(cancelled.cancellation?.cancelledAt ?? "", /^\d{4}-\d{2}-\d{2}T/);
    assert.strictEqual(also.cancellation?.causeType, "economic");
    assert.deepStrictEqual(
      getLaunch(planned.id, session.authorization).cancellation,
      cancelled.cancellation,
    );
  });

  void it("rejects a bad cause, an actor field, a closed launch, and a missing session", () => {
    const session = bearer();
    const launch = createLaunch(
      { pricePerPassenger: 10, rocketId: activeRocketId(), scheduledAt: futureIso() },
      session.authorization,
    );
    const body = { causeText: "Storm", causeType: "meteorological" };

    assert.throws(
      () =>
        cancelLaunch(
          launch.id,
          { causeText: "Storm", causeType: "weather" },
          session.authorization,
        ),
      (error: unknown) => statusOf(error) === BAD_REQUEST,
    );
    assert.throws(
      () =>
        cancelLaunch(
          launch.id,
          { causeText: "   ", causeType: "technical" },
          session.authorization,
        ),
      (error: unknown) => statusOf(error) === BAD_REQUEST,
    );
    assert.throws(
      () =>
        cancelLaunch(
          launch.id,
          { ...body, cancelledAt: "2026-09-29T16:00:00.000Z" },
          session.authorization,
        ),
      (error: unknown) => statusOf(error) === BAD_REQUEST,
    );
    assert.throws(
      () =>
        cancelLaunch(
          launch.id,
          { ...body, cancelledBy: { id: 1, name: "Ada" } },
          session.authorization,
        ),
      (error: unknown) => statusOf(error) === BAD_REQUEST,
    );
    assert.throws(
      () => cancelLaunch(9_999_999, body, session.authorization),
      (error: unknown) => statusOf(error) === NOT_FOUND,
    );
    assert.throws(
      () => cancelLaunch(launch.id, body, "Bearer missing"),
      (error: unknown) => statusOf(error) === UNAUTHORIZED,
    );

    getDb().prepare("UPDATE launches SET status = 'successful' WHERE id = ?").run(launch.id);
    assert.throws(
      () => cancelLaunch(launch.id, body, session.authorization),
      (error: unknown) => statusOf(error) === CONFLICT,
    );

    const doomed = createLaunch(
      { pricePerPassenger: 12, rocketId: activeRocketId(), scheduledAt: futureIso() },
      session.authorization,
    );
    cancelLaunch(doomed.id, body, session.authorization);
    const first = getLaunch(doomed.id, session.authorization).cancellation;
    assert.throws(
      () =>
        cancelLaunch(
          doomed.id,
          { causeText: "Changed", causeType: "economic" },
          session.authorization,
        ),
      (error: unknown) => statusOf(error) === CONFLICT,
    );
    assert.deepStrictEqual(getLaunch(doomed.id, session.authorization).cancellation, first);
  });
});
