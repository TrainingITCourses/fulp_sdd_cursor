import type { NextFunction, Request, Response } from "express";
import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { ApiError } from "../../server/errors.js";
import { postRegister } from "./register.controller.js";

const HTTP_CREATED = 201;
const HTTP_BAD_REQUEST = 400;
const uniqueEmail = (): string => `user-${Date.now()}-${Math.random()}@astro.test`;

void describe("register controller", () => {
  void it("postRegister returns 201 with user and token and omits password", async () => {
    const captured: { jsonData?: Record<string, unknown>; statusCode?: number } = {};
    const mockRes = {
      json: (data: unknown): void => {
        captured.jsonData = data as Record<string, unknown>;
      },
      status: (code: number) => {
        captured.statusCode = code;
        return mockRes;
      },
    };
    let nextErr: unknown;
    const req = {
      body: { email: uniqueEmail(), name: "Ada", password: "secret-pass" },
    } as unknown as Request;

    await postRegister(
      req,
      mockRes as unknown as Response,
      ((err?: unknown) => {
        nextErr = err;
      }) as NextFunction,
    );

    assert.equal(nextErr, undefined);
    assert.equal(captured.statusCode, HTTP_CREATED);
    const payload = captured.jsonData;
    assert.ok(payload);
    assert.equal(typeof payload["id"], "number");
    assert.equal(payload["name"], "Ada");
    assert.equal(typeof payload["token"], "string");
    assert.ok(!("password" in payload));
    assert.ok(!("passwordHash" in payload));
    assert.ok(!("password_hash" in payload));
  });

  void it("postRegister forwards validation errors", async () => {
    let nextErr: unknown;
    const mockRes = {
      json: (): void => {},
      status: () => mockRes,
    };
    const req = {
      body: { email: "not-an-email", name: "Ada", password: "secret" },
    } as unknown as Request;

    await postRegister(
      req,
      mockRes as unknown as Response,
      ((err?: unknown) => {
        nextErr = err;
      }) as NextFunction,
    );

    assert.ok(nextErr instanceof ApiError);
    assert.equal(nextErr.status, HTTP_BAD_REQUEST);
  });
});
