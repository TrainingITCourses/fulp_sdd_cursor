import assert from "node:assert";
import { describe, it } from "node:test";
import { initAuthRepository, insertSession, insertUser } from "../auth/auth.repository.js";
import {
  disableRocket,
  findRocketById,
  initRocketsRepository,
  insertRocket,
  listRockets,
  sessionExists,
  updateRocket,
} from "./rockets.repository.js";

const CONFLICT = 409;

initAuthRepository();
initRocketsRepository();

const uniqueName = (label: string): string =>
  `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

void describe("rockets repository", () => {
  void it("inserts a rocket with capacity 9 and finds it", () => {
    const name = uniqueName("insert");
    const record = insertRocket({ name, nameKey: name.toLowerCase(), range: "moon" });

    assert.ok(record.id > 0);
    assert.strictEqual(record.capacity, 9);
    assert.strictEqual(record.disabled, false);
    assert.strictEqual(findRocketById(record.id)?.name, name);
  });

  void it("lists rockets by created_at, including disabled ones", () => {
    const first = insertRocket({
      name: uniqueName("a"),
      nameKey: uniqueName("a").toLowerCase(),
      range: "earth",
    });
    const secondName = uniqueName("b");
    const second = insertRocket({
      name: secondName,
      nameKey: secondName.toLowerCase(),
      range: "mars",
    });
    disableRocket(second.id);

    const ids = listRockets().map((rocket) => rocket.id);
    assert.ok(ids.indexOf(first.id) < ids.indexOf(second.id));
    assert.strictEqual(listRockets().find((rocket) => rocket.id === second.id)?.disabled, true);
  });

  void it("updates name and range without changing capacity or disabled", () => {
    const name = uniqueName("edit");
    const created = insertRocket({ name, nameKey: name.toLowerCase(), range: "earth" });
    disableRocket(created.id);

    const nextName = uniqueName("edited");
    const updated = updateRocket({
      id: created.id,
      name: nextName,
      nameKey: nextName.toLowerCase(),
      range: "mars",
    });

    assert.strictEqual(updated?.name, nextName);
    assert.strictEqual(updated?.range, "mars");
    assert.strictEqual(updated?.capacity, 9);
    assert.strictEqual(updated?.disabled, true);
  });

  void it("rejects a duplicate name key with ApiError 409", () => {
    const name = uniqueName("dup");
    insertRocket({ name, nameKey: name.toLowerCase(), range: "earth" });

    assert.throws(
      () => {
        insertRocket({ name: name.toUpperCase(), nameKey: name.toLowerCase(), range: "moon" });
      },
      (error: unknown) =>
        error instanceof Error &&
        "status" in error &&
        (error as { status: unknown }).status === CONFLICT,
    );
  });

  void it("sessionExists matches a stored token", () => {
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
