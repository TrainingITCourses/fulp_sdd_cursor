import type { NextFunction, Request, Response } from "express";
import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { ApiError } from "../../server/errors.js";
import { registerUser } from "../register/register.service.js";
import { getMe, postLogin } from "./login.controller.js";

const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;
const uniqueEmail = (): string => `login-ctrl-${Date.now()}-${Math.random()}@astro.test`;

void describe("login controller", () => {
  void it("postLogin returns the user and token and omits the password", async () => {
    const email = uniqueEmail();
    await registerUser({ email, name: "Ada", password: "secret-pass" });
    const captured: { jsonData?: Record<string, unknown> } = {};
    const mockRes = {
      json: (data: unknown): void => {
        captured.jsonData = data as Record<string, unknown>;
      },
    };
    let nextErr: unknown;
    const req = {
      body: { email, password: "secret-pass" },
    } as unknown as Request;

    await postLogin(
      req,
      mockRes as unknown as Response,
      ((err?: unknown) => {
        nextErr = err;
      }) as NextFunction,
    );

    assert.equal(nextErr, undefined);
    const payload = captured.jsonData;
    assert.ok(payload);
    assert.equal(typeof payload["id"], "number");
    assert.equal(payload["email"], email);
    assert.equal(payload["name"], "Ada");
    assert.equal(typeof payload["token"], "string");
    assert.ok(!("password" in payload));
    assert.ok(!("passwordHash" in payload));
    assert.ok(!("password_hash" in payload));
  });

  void it("postLogin forwards validation errors", async () => {
    let nextErr: unknown;
    const mockRes = {
      json: (): void => {},
    };
    const req = {
      body: { email: "not-an-email", password: "secret" },
    } as unknown as Request;

    await postLogin(
      req,
      mockRes as unknown as Response,
      ((err?: unknown) => {
        nextErr = err;
      }) as NextFunction,
    );

    assert.ok(nextErr instanceof ApiError);
    assert.equal(nextErr.status, HTTP_BAD_REQUEST);
  });

  void it("getMe returns the profile for a valid token", async () => {
    const email = uniqueEmail();
    const created = await registerUser({ email, name: "Ada", password: "secret-pass" });
    const captured: { jsonData?: Record<string, unknown> } = {};
    const mockRes = {
      json: (data: unknown): void => {
        captured.jsonData = data as Record<string, unknown>;
      },
    };
    let nextErr: unknown;
    const req = {
      headers: { authorization: `Bearer ${created.token}` },
    } as unknown as Request;

    getMe(
      req,
      mockRes as unknown as Response,
      ((err?: unknown) => {
        nextErr = err;
      }) as NextFunction,
    );

    assert.equal(nextErr, undefined);
    assert.deepEqual(captured.jsonData, {
      email,
      id: created.id,
      name: "Ada",
    });
  });

  void it("getMe forwards missing-token errors", () => {
    let nextErr: unknown;
    const mockRes = {
      json: (): void => {},
    };
    const req = { headers: {} } as unknown as Request;

    getMe(
      req,
      mockRes as unknown as Response,
      ((err?: unknown) => {
        nextErr = err;
      }) as NextFunction,
    );

    assert.ok(nextErr instanceof ApiError);
    assert.equal(nextErr.status, HTTP_UNAUTHORIZED);
  });
});
