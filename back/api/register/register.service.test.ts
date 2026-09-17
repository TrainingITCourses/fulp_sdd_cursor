import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { ApiError } from "../../server/errors.js";
import { parseRegisterInput, registerUser } from "./register.service.js";

const HTTP_BAD_REQUEST = 400;
const HTTP_CONFLICT = 409;
const uniqueEmail = (): string => `svc-${Date.now()}-${Math.random()}@astro.test`;

void describe("register service", () => {
  void it("parseRegisterInput normalizes email and keeps name", () => {
    const input = parseRegisterInput({
      email: "  Ada@Astro.TEST  ",
      name: "  Ada  ",
      password: "secret-pass",
    });

    assert.deepEqual(input, {
      email: "ada@astro.test",
      name: "Ada",
      password: "secret-pass",
    });
  });

  void it("parseRegisterInput rejects missing fields", () => {
    assert.throws(() => parseRegisterInput({ email: "ada@astro.test" }), ApiError);
    try {
      parseRegisterInput({});
    } catch (err) {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, HTTP_BAD_REQUEST);
    }
  });

  void it("parseRegisterInput rejects invalid email", () => {
    try {
      parseRegisterInput({ email: "not-an-email", name: "Ada", password: "secret" });
      assert.fail("should throw");
    } catch (err) {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, HTTP_BAD_REQUEST);
      assert.equal(err.message, "Invalid email format");
    }
  });

  void it("registerUser creates a user and token without returning the password", async () => {
    const email = uniqueEmail();
    const result = await registerUser({ email, name: "Ada", password: "secret-pass" });

    assert.equal(result.email, email);
    assert.equal(result.name, "Ada");
    assert.equal(typeof result.id, "number");
    assert.equal(typeof result.token, "string");
    assert.ok(!("password" in result));
  });

  void it("registerUser rejects a duplicate email", async () => {
    const email = uniqueEmail();
    await registerUser({ email, name: "Ada", password: "secret-pass" });

    try {
      await registerUser({ email, name: "Other", password: "other-pass" });
      assert.fail("should throw");
    } catch (err) {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, HTTP_CONFLICT);
      assert.equal(err.message, "Email already registered");
    }
  });
});
