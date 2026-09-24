import assert from "node:assert";
import { describe, it } from "node:test";
import { insertSession, insertUser } from "../auth/auth.repository.js";
import { startAuthTracking } from "../auth/auth.service.js";
import { disableRocket, insertRocket } from "../rockets/rockets.repository.js";
import { startRocketsTracking } from "../rockets/rockets.service.js";
import {
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

const bearer = (): string => {
  const user = insertUser({
    email: `${uniqueName("user")}@example.com`,
    name: "Ada",
    passwordHash: "hash",
    role: "user",
  });
  const token = crypto.randomUUID();
  insertSession({ token, userId: user.id });
  return `Bearer ${token}`;
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
    const auth = bearer();
    const scheduledAt = futureIso();
    const launch = createLaunch(
      { pricePerPassenger: 2500, rocketId: activeRocketId(), scheduledAt },
      auth,
    );

    assert.strictEqual(launch.status, "planned");
    assert.strictEqual(launch.scheduledAt, scheduledAt);
    assert.strictEqual(launch.pricePerPassenger, 2500);
    assert.ok(launch.createdAt);
  });

  void it("rejects a missing rocket, a bad date, a bad price, and a status field with 400", () => {
    const auth = bearer();
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
    const auth = bearer();
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
    const auth = bearer();
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
  });

  void it("rejects an unknown launch id with 404", () => {
    assert.throws(
      () => getLaunch(9_999_999, bearer()),
      (error: unknown) => statusOf(error) === NOT_FOUND,
    );
  });
});
