import { ApiError } from "../../shared/errors.js";
import { isRecord } from "../../shared/guard.utils.js";
import { createLogger } from "../../shared/logger.js";
import { isNumber } from "../../shared/type.utils.js";
import {
  cancelLaunchRecord,
  findLaunchById,
  findRocketAvailability,
  findSessionUser,
  initLaunchesRepository,
  insertLaunch,
  listLaunches as listLaunchRows,
} from "./launches.repository.js";
import {
  CANCELLATION_CAUSE_TYPES,
  LAUNCH_STATUSES,
  type Cancellation,
  type CancellationCauseType,
  type Launch,
  type LaunchRecord,
  type LaunchStatus,
  type SessionUser,
} from "./launches.types.js";

const log = createLogger("launches");
const ROCKET_REQUIRED = "Rocket is required";
const BAD_DATE = "Scheduled date must be a future ISO 8601 date";
const BAD_PRICE = "Price per passenger must be a number greater than zero";
const STATUS_FORBIDDEN = "Status must not be sent";
const AUTH_REQUIRED = "Authentication required";
const BAD_CAUSE = "Cause type must be economic, meteorological, or technical";
const BAD_TEXT = "Cause text is required";
const ACTOR_FORBIDDEN = "Cancellation time and user must not be sent";
const NOT_CANCELLABLE = "Launch cannot be cancelled";
const LAUNCH_MISSING = "Launch not found";

const ISO_8601 = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?)?$/u;

export const startLaunchesTracking = (): void => {
  initLaunchesRepository();
};

const readSessionUser = (authorization: unknown): SessionUser => {
  if (typeof authorization !== "string") {
    throw new ApiError(401, AUTH_REQUIRED);
  }
  const match = /^Bearer (.+)$/.exec(authorization.trim());
  const token = match?.[1];
  const user = token ? findSessionUser(token) : undefined;
  if (!user) {
    throw new ApiError(401, AUTH_REQUIRED);
  }
  return user;
};

const requireSession = (authorization: unknown): void => {
  readSessionUser(authorization);
};

const isLaunchStatus = (value: string): value is LaunchStatus =>
  (LAUNCH_STATUSES as readonly string[]).includes(value);

const isCauseType = (value: string): value is CancellationCauseType =>
  (CANCELLATION_CAUSE_TYPES as readonly string[]).includes(value);

const toCancellation = (record: Readonly<LaunchRecord>): Cancellation | null => {
  const {
    cancellationCauseType,
    cancellationCauseText,
    cancelledAt,
    cancelledByUserId,
    cancelledByName,
  } = record;
  if (
    !cancellationCauseType ||
    !cancellationCauseText ||
    !cancelledAt ||
    cancelledByUserId === null ||
    !cancelledByName ||
    !isCauseType(cancellationCauseType)
  ) {
    return null;
  }
  return {
    cancelledAt,
    cancelledBy: { id: cancelledByUserId, name: cancelledByName },
    causeText: cancellationCauseText,
    causeType: cancellationCauseType,
  };
};

const toLaunch = (record: Readonly<LaunchRecord>): Launch => {
  if (!isLaunchStatus(record.status)) {
    log.error(`Invalid status for launch ${record.id}: ${record.status}`);
    throw new Error(`Stored launch ${record.id} has an invalid status: ${record.status}`);
  }
  return {
    cancellation: toCancellation(record),
    createdAt: record.createdAt,
    id: record.id,
    pricePerPassenger: record.pricePerPassenger,
    rocketId: record.rocketId,
    scheduledAt: record.scheduledAt,
    status: record.status,
  };
};

const readRocketId = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new ApiError(400, ROCKET_REQUIRED);
  }
  return value;
};

const readScheduledAt = (value: unknown): string => {
  if (typeof value !== "string" || !ISO_8601.test(value.trim())) {
    throw new ApiError(400, BAD_DATE);
  }
  const scheduledAt = value.trim();
  const instant = Date.parse(scheduledAt);
  if (!Number.isFinite(instant) || instant <= Date.now()) {
    throw new ApiError(400, BAD_DATE);
  }
  return scheduledAt;
};

const readPrice = (value: unknown): number => {
  if (!isNumber(value) || value <= 0) {
    throw new ApiError(400, BAD_PRICE);
  }
  return value;
};

const rejectStatus = (body: Readonly<Record<string, unknown>>): void => {
  if ("status" in body) {
    throw new ApiError(400, STATUS_FORBIDDEN);
  }
};

export const createLaunch = (body: unknown, authorization: unknown): Launch => {
  requireSession(authorization);
  const candidate = isRecord(body) ? body : {};
  rejectStatus(candidate);
  const rocketId = readRocketId(candidate["rocketId"]);
  const scheduledAt = readScheduledAt(candidate["scheduledAt"]);
  const pricePerPassenger = readPrice(candidate["pricePerPassenger"]);
  const rocket = findRocketAvailability(rocketId);
  if (!rocket) {
    throw new ApiError(404, "Rocket not found");
  }
  if (rocket.disabled) {
    throw new ApiError(409, "Rocket is disabled");
  }
  const record = insertLaunch({ pricePerPassenger, rocketId, scheduledAt });
  log.info(`Launch created: ${record.id}`);
  return toLaunch(record);
};

export const listLaunches = (authorization: unknown): Launch[] => {
  requireSession(authorization);
  return listLaunchRows().map((record) => toLaunch(record));
};

export const getLaunch = (id: number, authorization: unknown): Launch => {
  requireSession(authorization);
  const record = findLaunchById(id);
  if (!record) {
    throw new ApiError(404, LAUNCH_MISSING);
  }
  return toLaunch(record);
};

const rejectActor = (body: Readonly<Record<string, unknown>>): void => {
  if ("cancelledAt" in body || "cancelledBy" in body) {
    throw new ApiError(400, ACTOR_FORBIDDEN);
  }
};

const readCauseType = (value: unknown): CancellationCauseType => {
  if (typeof value !== "string" || !isCauseType(value)) {
    throw new ApiError(400, BAD_CAUSE);
  }
  return value;
};

const readCauseText = (value: unknown): string => {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ApiError(400, BAD_TEXT);
  }
  return value.trim();
};

const assertCancellable = (status: string): void => {
  if (status === "planned" || status === "confirmed") return;
  throw new ApiError(409, NOT_CANCELLABLE);
};

const loadLaunch = (id: number): LaunchRecord => {
  const record = findLaunchById(id);
  if (!record) {
    throw new ApiError(404, LAUNCH_MISSING);
  }
  return record;
};

export const cancelLaunch = (id: number, body: unknown, authorization: unknown): Launch => {
  const user = readSessionUser(authorization);
  const candidate = isRecord(body) ? body : {};
  rejectActor(candidate);
  const causeType = readCauseType(candidate["causeType"]);
  const causeText = readCauseText(candidate["causeText"]);
  const current = loadLaunch(id);
  assertCancellable(current.status);
  const cancelledAt = new Date().toISOString();
  cancelLaunchRecord({
    cancelledAt,
    cancelledByUserId: user.id,
    causeText,
    causeType,
    id,
  });
  log.info(`Launch cancelled: ${id}`);
  return toLaunch(loadLaunch(id));
};
