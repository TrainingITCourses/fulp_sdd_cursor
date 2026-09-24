import { ApiError } from "../../shared/errors.js";
import { isRecord } from "../../shared/guard.utils.js";
import { createLogger } from "../../shared/logger.js";
import { isNumber } from "../../shared/type.utils.js";
import {
  findLaunchById,
  findRocketAvailability,
  initLaunchesRepository,
  insertLaunch,
  listLaunches as listLaunchRows,
  sessionExists,
} from "./launches.repository.js";
import {
  LAUNCH_STATUSES,
  type Launch,
  type LaunchRecord,
  type LaunchStatus,
} from "./launches.types.js";

const log = createLogger("launches");
const ROCKET_REQUIRED = "Rocket is required";
const BAD_DATE = "Scheduled date must be a future ISO 8601 date";
const BAD_PRICE = "Price per passenger must be a number greater than zero";
const STATUS_FORBIDDEN = "Status must not be sent";
const AUTH_REQUIRED = "Authentication required";

const ISO_8601 = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?)?$/u;

export const startLaunchesTracking = (): void => {
  initLaunchesRepository();
};

const requireSession = (authorization: unknown): void => {
  if (typeof authorization !== "string") {
    throw new ApiError(401, AUTH_REQUIRED);
  }
  const match = /^Bearer (.+)$/.exec(authorization.trim());
  const token = match?.[1];
  if (!token || !sessionExists(token)) {
    throw new ApiError(401, AUTH_REQUIRED);
  }
};

const isLaunchStatus = (value: string): value is LaunchStatus =>
  (LAUNCH_STATUSES as readonly string[]).includes(value);

const toLaunch = (record: Readonly<LaunchRecord>): Launch => {
  if (!isLaunchStatus(record.status)) {
    log.error(`Invalid status for launch ${record.id}: ${record.status}`);
    throw new Error(`Stored launch ${record.id} has an invalid status: ${record.status}`);
  }
  return {
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
    throw new ApiError(404, "Launch not found");
  }
  return toLaunch(record);
};
