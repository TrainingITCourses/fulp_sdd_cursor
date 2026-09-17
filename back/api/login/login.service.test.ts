import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { ApiError } from "../../server/errors.js";
import { registerUser } from "../register/register.service.js";
import { getCurrentUser, loginUser, parseAccessToken, parseLoginInput } from "./login.service.js";

const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;
const uniqueEmail = (): string => `login-svc-${Date.now()}-${Math.random()}@astro.test`;

void describe("login service", () => {
  void it("parseLoginInput normalizes email and keeps the password", () => {
    const input = parseLoginInput({
      email: "  Ada@Astro.TEST  ",
      password: "secret-pass",
    });

    assert.deepEqual(input, {
      email: "ada@astro.test",
      password: "secret-pass",
    });
  });

  void it("parseLoginInput rejects missing fields", () => {
    assert.throws(() => parseLoginInput({ email: "ada@astro.test" }), ApiError);
    try {
      parseLoginInput({});
    } catch (err) {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, HTTP_BAD_REQUEST);
      assert.equal(err.message, "Email and password are required");
    }
  });

  void it("parseLoginInput rejects invalid email", () => {
    try {
      parseLoginInput({ email: "not-an-email", password: "secret" });
      assert.fail("should throw");
    } catch (err) {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, HTTP_BAD_REQUEST);
      assert.equal(err.message, "Invalid email format");
    }
  });

  void it("parseAccessToken reads a Bearer token", () => {
    assert.equal(parseAccessToken("Bearer tok-1"), "tok-1");
  });

  void it("parseAccessToken rejects a missing or empty token", () => {
    try {
      parseAccessToken(undefined);
      assert.fail("should throw");
    } catch (err) {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, HTTP_UNAUTHORIZED);
      assert.equal(err.message, "Invalid or missing token");
    }
  });

  void it("loginUser returns the user and token without the password", async () => {
    const email = uniqueEmail();
    const created = await registerUser({ email, name: "Ada", password: "secret-pass" });

    const result = await loginUser({ email, password: "secret-pass" });

    assert.equal(result.email, email);
    assert.equal(result.name, "Ada");
    assert.equal(result.id, created.id);
    assert.equal(result.token, created.token);
    assert.ok(!("password" in result));
    assert.ok(!("passwordHash" in result));
  });

  void it("loginUser rejects unknown or wrong credentials", async () => {
    const email = uniqueEmail();
    await registerUser({ email, name: "Ada", password: "secret-pass" });

    try {
      await loginUser({ email, password: "wrong-pass" });
      assert.fail("should throw");
    } catch (err) {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, HTTP_UNAUTHORIZED);
      assert.equal(err.message, "Invalid credentials");
    }

    try {
      await loginUser({ email: uniqueEmail(), password: "secret-pass" });
      assert.fail("should throw");
    } catch (err) {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, HTTP_UNAUTHORIZED);
    }
  });

  void it("getCurrentUser returns the profile for a valid token", async () => {
    const email = uniqueEmail();
    const created = await registerUser({ email, name: "Ada", password: "secret-pass" });

    const profile = getCurrentUser(`Bearer ${created.token}`);

    assert.deepEqual(profile, { email, id: created.id, name: "Ada" });
    assert.ok(!("password" in profile));
    assert.ok(!("token" in profile));
  });

  void it("getCurrentUser rejects an unknown token", () => {
    try {
      getCurrentUser("Bearer unknown-token");
      assert.fail("should throw");
    } catch (err) {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, HTTP_UNAUTHORIZED);
      assert.equal(err.message, "Invalid or missing token");
    }
  });
});
