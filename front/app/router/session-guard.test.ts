import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { redirectTargetWithoutSession, LOGIN_PATH } from "./session-guard.js";

void describe("session guard", () => {
  void test("sends an anonymous visitor to login", () => {
    assert.equal(redirectTargetWithoutSession(false), LOGIN_PATH);
  });

  void test("stays on the fleet page when a session exists", () => {
    assert.equal(redirectTargetWithoutSession(true), undefined);
  });
});
