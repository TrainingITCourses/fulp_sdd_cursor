import type { Request, Response } from "express";
import assert from "node:assert";
import { describe, it } from "node:test";
import { insertSession, insertUser } from "../auth/auth.repository.js";
import { startAuthTracking } from "../auth/auth.service.js";
import { insertRocket } from "../rockets/rockets.repository.js";
import { startRocketsTracking } from "../rockets/rockets.service.js";
import { getLaunchById, getLaunches, postLaunch } from "./launches.controller.js";
import { startLaunchesTracking } from "./launches.service.js";

const CREATED = 201;

startAuthTracking();
startRocketsTracking();
startLaunchesTracking();

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

const rocketId = (): number => {
  const name = uniqueName("rocket");
  return insertRocket({ name, nameKey: name.toLowerCase(), range: "mars" }).id;
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

void describe("launches controller", () => {
  void it("postLaunch responds 201 with a planned launch", () => {
    const captured = mockRes();
    const req = {
      body: {
        pricePerPassenger: 99,
        rocketId: rocketId(),
        scheduledAt: new Date(Date.now() + 86_400_000).toISOString(),
      },
      header: (): string => bearer(),
    };

    postLaunch(req as unknown as Request, captured.res);

    assert.strictEqual(captured.statusCode, CREATED);
    assert.strictEqual((captured.body as { status: string }).status, "planned");
  });

  void it("getLaunches returns the list as json", () => {
    const auth = bearer();
    const scheduledAt = new Date(Date.now() + 120_000_000).toISOString();
    const created = mockRes();
    postLaunch(
      {
        body: { pricePerPassenger: 15, rocketId: rocketId(), scheduledAt },
        header: (): string => auth,
      } as unknown as Request,
      created.res,
    );

    const listed = mockRes();
    getLaunches({ header: (): string => auth } as unknown as Request, listed.res);

    const rows = listed.body as { scheduledAt: string }[];
    assert.ok(rows.some((launch) => launch.scheduledAt === scheduledAt));
  });

  void it("getLaunchById rejects a non-numeric id with 404", () => {
    const req = {
      header: (): string => bearer(),
      params: { launchId: "nope" },
    };

    assert.throws(
      () => {
        getLaunchById(req as unknown as Request, mockRes().res);
      },
      (error: unknown) =>
        error instanceof Error && "status" in error && (error as { status: number }).status === 404,
    );
  });
});
