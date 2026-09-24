import { ApiError } from "../../shared/errors.js";
import { isNonEmptyString, isRecord } from "../../shared/guard.utils.js";
import { createLogger } from "../../shared/logger.js";
import {
  disableRocket as disableRocketRow,
  findRocketById,
  initRocketsRepository,
  insertRocket,
  listRockets as listRocketRows,
  sessionExists,
  updateRocket as updateRocketRow,
} from "./rockets.repository.js";
import {
  ROCKET_CAPACITY,
  ROCKET_RANGES,
  type Rocket,
  type RocketRange,
  type RocketRecord,
} from "./rockets.types.js";

const log = createLogger("rockets");
const BAD_RANGE = "Range must be earth, moon, or mars";
const BAD_CAPACITY = "Capacity must be 9";
const NAME_REQUIRED = "Name is required";
const NAME_OR_RANGE = "Name or range is required";

export const startRocketsTracking = (): void => {
  initRocketsRepository();
};

const requireSession = (authorization: unknown): void => {
  if (typeof authorization !== "string") {
    throw new ApiError(401, "Authentication required");
  }
  const match = /^Bearer (.+)$/.exec(authorization.trim());
  const token = match?.[1];
  if (!token || !sessionExists(token)) {
    throw new ApiError(401, "Authentication required");
  }
};

const isRocketRange = (value: unknown): value is RocketRange =>
  typeof value === "string" && (ROCKET_RANGES as readonly string[]).includes(value);

const rejectForeignCapacity = (body: Readonly<Record<string, unknown>>): void => {
  if (!("capacity" in body)) return;
  if (body["capacity"] !== ROCKET_CAPACITY) {
    throw new ApiError(400, BAD_CAPACITY);
  }
};

const readName = (value: unknown): string => {
  if (!isNonEmptyString(value)) {
    throw new ApiError(400, NAME_REQUIRED);
  }
  return value.trim();
};

const readRange = (value: unknown): RocketRange => {
  if (!isRocketRange(value)) {
    throw new ApiError(400, BAD_RANGE);
  }
  return value;
};

const toRocket = (record: Readonly<RocketRecord>): Rocket => {
  if (!isRocketRange(record.range)) {
    log.error(`Invalid range for rocket ${record.id}: ${record.range}`);
    throw new Error(`Stored rocket ${record.id} has an invalid range: ${record.range}`);
  }
  return {
    capacity: ROCKET_CAPACITY,
    createdAt: record.createdAt,
    disabled: record.disabled,
    id: record.id,
    name: record.name,
    range: record.range,
  };
};

const nameKeyOf = (name: string): string => name.toLowerCase();

const requireRocket = (id: number): RocketRecord => {
  const record = findRocketById(id);
  if (!record) {
    throw new ApiError(404, "Rocket not found");
  }
  return record;
};

export const createRocket = (body: unknown, authorization: unknown): Rocket => {
  requireSession(authorization);
  const candidate = isRecord(body) ? body : {};
  rejectForeignCapacity(candidate);
  const name = readName(candidate["name"]);
  const range = readRange(candidate["range"]);
  const record = insertRocket({ name, nameKey: nameKeyOf(name), range });
  log.info(`Rocket created: ${record.id}`);
  return toRocket(record);
};

export const listRockets = (authorization: unknown): Rocket[] => {
  requireSession(authorization);
  return listRocketRows().map((record) => toRocket(record));
};

export const getRocket = (id: number, authorization: unknown): Rocket => {
  requireSession(authorization);
  return toRocket(requireRocket(id));
};

const readOptionalName = (body: Readonly<Record<string, unknown>>, current: string): string => {
  if (!("name" in body)) return current;
  return readName(body["name"]);
};

const readOptionalRange = (
  body: Readonly<Record<string, unknown>>,
  current: RocketRange,
): RocketRange => {
  if (!("range" in body)) return current;
  return readRange(body["range"]);
};

const assertPatchTouches = (body: Readonly<Record<string, unknown>>): void => {
  if (!("name" in body) && !("range" in body)) {
    throw new ApiError(400, NAME_OR_RANGE);
  }
};

export const updateRocket = (id: number, body: unknown, authorization: unknown): Rocket => {
  requireSession(authorization);
  const candidate = isRecord(body) ? body : {};
  rejectForeignCapacity(candidate);
  assertPatchTouches(candidate);
  const current = toRocket(requireRocket(id));
  const name = readOptionalName(candidate, current.name);
  const range = readOptionalRange(candidate, current.range);
  const updated = updateRocketRow({ id, name, nameKey: nameKeyOf(name), range });
  if (!updated) {
    throw new ApiError(404, "Rocket not found");
  }
  log.info(`Rocket updated: ${id}`);
  return toRocket(updated);
};

export const disableRocket = (id: number, authorization: unknown): Rocket => {
  requireSession(authorization);
  const current = requireRocket(id);
  if (current.disabled) {
    throw new ApiError(409, "Rocket already disabled");
  }
  const updated = disableRocketRow(id);
  if (!updated) {
    throw new ApiError(404, "Rocket not found");
  }
  log.info(`Rocket disabled: ${id}`);
  return toRocket(updated);
};
