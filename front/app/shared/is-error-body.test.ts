import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { isErrorBody } from "./is-error-body.js";

void describe("isErrorBody", () => {
  void test("accepts a body with a string error field", () => {
    assert.equal(isErrorBody({ error: "Invalid credentials" }), true);
  });

  void test("rejects a body without a string error field", () => {
    assert.equal(isErrorBody({ error: 42 }), false);
    assert.equal(isErrorBody({}), false);
    // oxlint-disable-next-line unicorn/no-null
    assert.equal(isErrorBody(null), false);
    assert.equal(isErrorBody("oops"), false);
    assert.equal(isErrorBody(undefined), false);
  });
});
