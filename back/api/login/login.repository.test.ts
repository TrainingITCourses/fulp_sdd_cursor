import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { insertUser } from "../register/register.repository.js";
import { findUserByEmail, findUserByToken, toUserProfile } from "./login.repository.js";

const uniqueEmail = (): string => `login-repo-${Date.now()}-${Math.random()}@astro.test`;

void describe("login repository", () => {
  void it("findUserByEmail returns the stored user", () => {
    const email = uniqueEmail();
    const created = insertUser({
      email,
      name: "Ada",
      passwordHash: "hashed",
      token: "token-1",
    });

    const found = findUserByEmail(email);

    assert.ok(found);
    assert.equal(found.id, created.id);
    assert.equal(found.email, email);
    assert.equal(found.name, "Ada");
    assert.equal(found.passwordHash, "hashed");
    assert.equal(found.token, "token-1");
  });

  void it("findUserByEmail returns undefined when the email is unknown", () => {
    assert.equal(findUserByEmail(uniqueEmail()), undefined);
  });

  void it("findUserByToken returns the stored user", () => {
    const token = `token-${Date.now()}-${Math.random()}`;
    const created = insertUser({
      email: uniqueEmail(),
      name: "Ada",
      passwordHash: "hashed",
      token,
    });

    const found = findUserByToken(token);

    assert.ok(found);
    assert.equal(found.id, created.id);
    assert.equal(found.token, token);
  });

  void it("findUserByToken returns undefined when the token is unknown", () => {
    assert.equal(findUserByToken("missing-token"), undefined);
  });

  void it("toUserProfile omits the password hash and token", () => {
    const profile = toUserProfile({
      email: "ada@astro.test",
      id: 1,
      name: "Ada",
      passwordHash: "hashed",
      token: "token-1",
    });

    assert.deepEqual(profile, { email: "ada@astro.test", id: 1, name: "Ada" });
    assert.ok(!("passwordHash" in profile));
    assert.ok(!("token" in profile));
  });
});
