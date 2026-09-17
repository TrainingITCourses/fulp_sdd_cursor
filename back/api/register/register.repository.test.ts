import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { ApiError } from "../../server/errors.js";
import { initRegisterRepository, insertUser } from "./register.repository.js";

const HTTP_CONFLICT = 409;
const uniqueEmail = (): string => `repo-${Date.now()}-${Math.random()}@astro.test`;

void describe("register repository", () => {
  initRegisterRepository();

  void it("insertUser stores a user and returns public fields", () => {
    const email = uniqueEmail();
    const result = insertUser({
      email,
      name: "Ada",
      passwordHash: "hashed",
      token: "token-1",
    });

    assert.equal(result.email, email);
    assert.equal(result.name, "Ada");
    assert.equal(result.token, "token-1");
    assert.equal(typeof result.id, "number");
    assert.ok(result.id > 0);
    assert.ok(!("passwordHash" in result));
  });

  void it("insertUser rejects a duplicate email", () => {
    const email = uniqueEmail();
    insertUser({
      email,
      name: "Ada",
      passwordHash: "hashed",
      token: "token-1",
    });

    try {
      insertUser({
        email,
        name: "Other",
        passwordHash: "hashed-2",
        token: "token-2",
      });
      assert.fail("should throw");
    } catch (err) {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, HTTP_CONFLICT);
    }
  });
});
