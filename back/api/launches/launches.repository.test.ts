import assert from "node:assert";
import { describe, it } from "node:test";
import { initAuthRepository, insertSession, insertUser } from "../auth/auth.repository.js";
import { initRocketsRepository, insertRocket } from "../rockets/rockets.repository.js";
import {
  findLaunchById,
  findRocketAvailability,
  initLaunchesRepository,
  insertLaunch,
  listLaunches,
  sessionExists,
} from "./launches.repository.js";

initAuthRepository();
initRocketsRepository();
initLaunchesRepository();

const uniqueName = (label: string): string =>
  `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const futureIso = (offsetMs: number): string => new Date(Date.now() + offsetMs).toISOString();

const rocketId = (): number => {
  const name = uniqueName("rocket");
  return insertRocket({ name, nameKey: name.toLowerCase(), range: "earth" }).id;
};

void describe("launches repository", () => {
  void it("inserts a planned launch and finds it", () => {
    const scheduledAt = futureIso(86_400_000);
    const record = insertLaunch({
      pricePerPassenger: 1200,
      rocketId: rocketId(),
      scheduledAt,
    });

    assert.ok(record.id > 0);
    assert.strictEqual(record.status, "planned");
    assert.strictEqual(record.pricePerPassenger, 1200);
    assert.strictEqual(findLaunchById(record.id)?.scheduledAt, scheduledAt);
  });

  void it("lists launches ordered by scheduled_at", () => {
    const later = insertLaunch({
      pricePerPassenger: 10,
      rocketId: rocketId(),
      scheduledAt: futureIso(200_000_000),
    });
    const sooner = insertLaunch({
      pricePerPassenger: 20,
      rocketId: rocketId(),
      scheduledAt: futureIso(100_000_000),
    });

    const ids = listLaunches().map((launch) => launch.id);
    assert.ok(ids.indexOf(sooner.id) < ids.indexOf(later.id));
  });

  void it("returns undefined when the launch does not exist", () => {
    assert.strictEqual(findLaunchById(9_999_999), undefined);
  });

  void it("reads rocket availability and session tokens", () => {
    const id = rocketId();
    assert.strictEqual(findRocketAvailability(id)?.disabled, false);
    assert.strictEqual(findRocketAvailability(9_999_999), undefined);

    const user = insertUser({
      email: `${uniqueName("user")}@example.com`,
      name: "Ada",
      passwordHash: "hash",
      role: "user",
    });
    const token = crypto.randomUUID();
    insertSession({ token, userId: user.id });
    assert.strictEqual(sessionExists(token), true);
    assert.strictEqual(sessionExists("missing-token"), false);
  });
});
