import type { Request, Response } from "express";
import assert from "node:assert";
import { describe, it } from "node:test";
import { insertSession, insertUser } from "../auth/auth.repository.js";
import { startAuthTracking } from "../auth/auth.service.js";
import { getRocketById, getRockets, postRocket } from "./rockets.controller.js";
import { startRocketsTracking } from "./rockets.service.js";

const CREATED = 201;

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

const mockRes = (): { statusCode: number; body: unknown; res: Response } => {
  const captured = { statusCode: 200, body: undefined as unknown };
  const res = {
    json: (data: unknown): void => {
      captured.body = data;
    },
    status: (code: number): { json: (data: unknown) => void } => {
      captured.statusCode = code;
      return {
        json: (data: unknown): void => {
          captured.body = data;
        },
      };
    },
  };
  return {
    get statusCode() {
      return captured.statusCode;
    },
    get body() {
      return captured.body;
    },
    res: res as unknown as Response,
  };
};

void describe("rockets controller", () => {
  void it("postRocket responds 201 with the created rocket", () => {
    const captured = mockRes();
    const req = {
      body: { name: uniqueName("post"), range: "earth" },
      header: (): string => bearer(),
    };

    postRocket(req as unknown as Request, captured.res);

    assert.strictEqual(captured.statusCode, CREATED);
    assert.strictEqual((captured.body as { capacity: number }).capacity, 9);
  });

  void it("getRockets returns the list as json", () => {
    const auth = bearer();
    const name = uniqueName("list");
    const created = mockRes();
    postRocket(
      { body: { name, range: "moon" }, header: (): string => auth } as unknown as Request,
      created.res,
    );

    const listed = mockRes();
    getRockets({ header: (): string => auth } as unknown as Request, listed.res);

    const rows = listed.body as { name: string }[];
    assert.ok(rows.some((rocket) => rocket.name === name));
  });

  void it("getRocketById rejects a non-numeric id with 404", () => {
    const req = {
      header: (): string => bearer(),
      params: { rocketId: "nope" },
    };

    assert.throws(
      () => {
        getRocketById(req as unknown as Request, mockRes().res);
      },
      (error: unknown) =>
        error instanceof Error && "status" in error && (error as { status: number }).status === 404,
    );
  });
});
