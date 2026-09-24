import assert from "node:assert";
import { describe, it } from "node:test";
import { insertSession, insertUser } from "../auth/auth.repository.js";
import { startAuthTracking } from "../auth/auth.service.js";
import {
  createRocket,
  disableRocket,
  getRocket,
  listRockets,
  startRocketsTracking,
  updateRocket,
} from "./rockets.service.js";

const BAD_REQUEST = 400;
const UNAUTHORIZED = 401;
const NOT_FOUND = 404;
const CONFLICT = 409;

startAuthTracking();
startRocketsTracking();

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

const statusOf = (error: unknown): number | undefined =>
  error instanceof Error && "status" in error ? (error as { status: number }).status : undefined;

void describe("rockets service", () => {
  void it("creates a rocket with capacity 9 and disabled false", () => {
    const auth = bearer();
    const name = uniqueName("create");
    const rocket = createRocket({ name: `  ${name}  `, range: "moon" }, auth);

    assert.strictEqual(rocket.name, name);
    assert.strictEqual(rocket.range, "moon");
    assert.strictEqual(rocket.capacity, 9);
    assert.strictEqual(rocket.disabled, false);
    assert.ok(rocket.createdAt);
  });

  void it("rejects an empty name or a bad range with 400", () => {
    const auth = bearer();
    assert.throws(
      () => createRocket({ name: "  ", range: "earth" }, auth),
      (error: unknown) => statusOf(error) === BAD_REQUEST,
    );
    assert.throws(
      () => createRocket({ name: uniqueName("bad"), range: "pluto" }, auth),
      (error: unknown) => statusOf(error) === BAD_REQUEST,
    );
  });

  void it("rejects a capacity other than 9 on create and update", () => {
    const auth = bearer();
    const created = createRocket({ name: uniqueName("cap"), range: "earth" }, auth);

    assert.throws(
      () => createRocket({ name: uniqueName("cap2"), range: "earth", capacity: 8 }, auth),
      (error: unknown) => statusOf(error) === BAD_REQUEST,
    );
    assert.throws(
      () => updateRocket(created.id, { range: "mars", capacity: 4 }, auth),
      (error: unknown) => statusOf(error) === BAD_REQUEST,
    );
    assert.strictEqual(getRocket(created.id, auth).range, "earth");
  });

  void it("rejects a duplicate name with 409", () => {
    const auth = bearer();
    const name = uniqueName("dup");
    createRocket({ name, range: "earth" }, auth);

    assert.throws(
      () => createRocket({ name: name.toUpperCase(), range: "mars" }, auth),
      (error: unknown) => statusOf(error) === CONFLICT,
    );
  });

  void it("lists every rocket, including disabled ones", () => {
    const auth = bearer();
    const kept = createRocket({ name: uniqueName("kept"), range: "earth" }, auth);
    const retired = createRocket({ name: uniqueName("retired"), range: "mars" }, auth);
    disableRocket(retired.id, auth);

    const ids = listRockets(auth).map((rocket) => rocket.id);
    assert.ok(ids.includes(kept.id));
    assert.ok(ids.includes(retired.id));
  });

  void it("returns 404 for an unknown rocket", () => {
    const auth = bearer();
    assert.throws(
      () => getRocket(9_999_999, auth),
      (error: unknown) => statusOf(error) === NOT_FOUND,
    );
  });

  void it("updates name or range and keeps capacity and disabled", () => {
    const auth = bearer();
    const created = createRocket({ name: uniqueName("edit"), range: "earth" }, auth);
    disableRocket(created.id, auth);
    const nextName = uniqueName("renamed");

    const updated = updateRocket(created.id, { name: nextName }, auth);

    assert.strictEqual(updated.name, nextName);
    assert.strictEqual(updated.range, "earth");
    assert.strictEqual(updated.capacity, 9);
    assert.strictEqual(updated.disabled, true);
  });

  void it("rejects an empty patch with 400", () => {
    const auth = bearer();
    const created = createRocket({ name: uniqueName("patch"), range: "moon" }, auth);
    assert.throws(
      () => updateRocket(created.id, {}, auth),
      (error: unknown) => statusOf(error) === BAD_REQUEST,
    );
  });

  void it("disables a rocket once and then returns 409", () => {
    const auth = bearer();
    const created = createRocket({ name: uniqueName("off"), range: "mars" }, auth);
    const disabled = disableRocket(created.id, auth);

    assert.strictEqual(disabled.disabled, true);
    assert.strictEqual(getRocket(created.id, auth).disabled, true);
    assert.throws(
      () => disableRocket(created.id, auth),
      (error: unknown) => statusOf(error) === CONFLICT,
    );
  });

  void it("rejects missing or unknown sessions with 401", () => {
    assert.throws(
      () => listRockets(undefined),
      (error: unknown) => statusOf(error) === UNAUTHORIZED,
    );
    assert.throws(
      () => getRocket(1, "Bearer missing"),
      (error: unknown) => statusOf(error) === UNAUTHORIZED,
    );
    assert.throws(
      () => createRocket({ name: uniqueName("nope"), range: "earth" }, "Token abc"),
      (error: unknown) => statusOf(error) === UNAUTHORIZED,
    );
  });
});
