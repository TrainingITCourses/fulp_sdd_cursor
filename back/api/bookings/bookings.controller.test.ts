import type { Request, Response } from "express";
import assert from "node:assert";
import { describe, it } from "node:test";
import { insertSession, insertUser } from "../auth/auth.repository.js";
import { startAuthTracking } from "../auth/auth.service.js";
import { insertLaunch } from "../launches/launches.repository.js";
import { startLaunchesTracking } from "../launches/launches.service.js";
import { insertRocket } from "../rockets/rockets.repository.js";
import { startRocketsTracking } from "../rockets/rockets.service.js";
import { deleteBooking, getBookings, postBooking } from "./bookings.controller.js";
import { startBookingsTracking } from "./bookings.service.js";

const CREATED = 201;

startAuthTracking();
startRocketsTracking();
startLaunchesTracking();
startBookingsTracking();

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

const plannedLaunchId = (): number => {
  const name = uniqueName("rocket");
  const rocketId = insertRocket({ name, nameKey: name.toLowerCase(), range: "earth" }).id;
  return insertLaunch({
    pricePerPassenger: 100,
    rocketId,
    scheduledAt: new Date(Date.now() + 86_400_000).toISOString(),
  }).id;
};

const mockRes = (): { statusCode: number; body: unknown; ended: boolean; res: Response } => {
  const captured = { statusCode: 200, body: undefined as unknown, ended: false };
  const res = {
    json: (data: unknown): void => {
      captured.body = data;
    },
    status: (code: number): { json: (data: unknown) => void; end: () => void } => {
      captured.statusCode = code;
      return {
        end: (): void => {
          captured.ended = true;
        },
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
    get ended() {
      return captured.ended;
    },
    res: res as unknown as Response,
  };
};

const statusOf = (error: unknown): number | undefined =>
  error instanceof Error && "status" in error ? (error as { status: number }).status : undefined;

void describe("bookings controller", () => {
  void it("postBooking responds 201 with the booking", () => {
    const auth = bearer();
    const launchId = plannedLaunchId();
    const captured = mockRes();

    postBooking(
      {
        body: { email: "ada@example.com", name: "Ada", phone: "600" },
        header: (): string => auth,
        params: { launchId: String(launchId) },
      } as unknown as Request,
      captured.res,
    );

    assert.strictEqual(captured.statusCode, CREATED);
    const body = captured.body as Record<string, unknown>;
    assert.deepStrictEqual(Object.keys(body).toSorted(), [
      "createdAt",
      "email",
      "id",
      "launchId",
      "name",
      "phone",
    ]);
    assert.strictEqual(body["launchId"], launchId);
  });

  void it("getBookings responds 200 with seats and passengers", () => {
    const auth = bearer();
    const launchId = plannedLaunchId();
    postBooking(
      {
        body: { email: "ada@example.com", name: "Ada", phone: "600" },
        header: (): string => auth,
        params: { launchId: String(launchId) },
      } as unknown as Request,
      mockRes().res,
    );
    const listed = mockRes();

    getBookings(
      { header: (): string => auth, params: { launchId: String(launchId) } } as unknown as Request,
      listed.res,
    );

    assert.strictEqual(listed.statusCode, 200);
    const body = listed.body as {
      capacity: number;
      taken: number;
      free: number;
      bookings: unknown[];
    };
    assert.strictEqual(body.capacity, 9);
    assert.strictEqual(body.taken, 1);
    assert.strictEqual(body.free, 8);
    assert.strictEqual(body.bookings.length, 1);
  });

  void it("deleteBooking responds 204 without body and frees the seat", () => {
    const auth = bearer();
    const launchId = plannedLaunchId();
    const created = mockRes();
    postBooking(
      {
        body: { email: "ada@example.com", name: "Ada", phone: "600" },
        header: (): string => auth,
        params: { launchId: String(launchId) },
      } as unknown as Request,
      created.res,
    );
    const bookingId = (created.body as { id: number }).id;
    const deleted = mockRes();

    deleteBooking(
      {
        header: (): string => auth,
        params: { bookingId: String(bookingId), launchId: String(launchId) },
      } as unknown as Request,
      deleted.res,
    );

    assert.strictEqual(deleted.statusCode, 204);
    assert.strictEqual(deleted.ended, true);
    assert.strictEqual(deleted.body, undefined);
    const listed = mockRes();
    getBookings(
      { header: (): string => auth, params: { launchId: String(launchId) } } as unknown as Request,
      listed.res,
    );
    const body = listed.body as { free: number; taken: number; bookings: unknown[] };
    assert.strictEqual(body.free, 9);
    assert.strictEqual(body.taken, 0);
    assert.strictEqual(body.bookings.length, 0);
  });

  void it("deleteBooking rejects a non-numeric booking id with 404", () => {
    const req = {
      header: (): string => bearer(),
      params: { bookingId: "nope", launchId: String(plannedLaunchId()) },
    };

    assert.throws(
      () => deleteBooking(req as unknown as Request, mockRes().res),
      (error: unknown) => statusOf(error) === 404,
    );
  });

  void it("rejects a non-numeric launch id with 404", () => {
    const req = { header: (): string => bearer(), params: { launchId: "nope" } };

    assert.throws(
      () => getBookings(req as unknown as Request, mockRes().res),
      (error: unknown) => statusOf(error) === 404,
    );
    assert.throws(
      () => postBooking({ ...req, body: {} } as unknown as Request, mockRes().res),
      (error: unknown) => statusOf(error) === 404,
    );
  });
});
