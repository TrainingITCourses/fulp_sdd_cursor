import { ApiError } from "../../shared/errors.js";
import { isRecord } from "../../shared/guard.utils.js";
import { createLogger } from "../../shared/logger.js";
import {
  findLaunchSeats,
  findSessionUser,
  initBookingsRepository,
  insertBookingIfSeatFree,
  listBookingsByLaunch,
} from "./bookings.repository.js";
import type { Booking, LaunchBookings, LaunchSeats, SessionUser } from "./bookings.types.js";

const log = createLogger("bookings");
const AUTH_REQUIRED = "Authentication required";
const NAME_REQUIRED = "Passenger name is required";
const BAD_EMAIL = "Passenger email is required and must contain @";
const PHONE_REQUIRED = "Passenger phone is required";
const FIELDS_FORBIDDEN = "Booking id, time, user and launch must not be sent";
const LAUNCH_MISSING = "Launch not found";
const NOT_PLANNED = "Launch is not planned";
const NO_SEATS = "Launch has no free seats";

const FORBIDDEN_FIELDS = ["id", "launchId", "createdAt", "userId", "bookedBy", "bookedByUserId"];

export const startBookingsTracking = (): void => {
  initBookingsRepository();
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

const rejectForbiddenFields = (body: Readonly<Record<string, unknown>>): void => {
  if (FORBIDDEN_FIELDS.some((field) => field in body)) {
    throw new ApiError(400, FIELDS_FORBIDDEN);
  }
};

const readText = (value: unknown, message: string): string => {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ApiError(400, message);
  }
  return value.trim();
};

const readEmail = (value: unknown): string => {
  const email = readText(value, BAD_EMAIL);
  if (!email.includes("@")) {
    throw new ApiError(400, BAD_EMAIL);
  }
  return email;
};

const loadLaunchSeats = (launchId: number): LaunchSeats => {
  const seats = findLaunchSeats(launchId);
  if (!seats) {
    throw new ApiError(404, LAUNCH_MISSING);
  }
  return seats;
};

const assertBookable = (seats: Readonly<LaunchSeats>): void => {
  if (seats.status !== "planned") {
    throw new ApiError(409, NOT_PLANNED);
  }
  if (seats.taken >= seats.capacity) {
    throw new ApiError(409, NO_SEATS);
  }
};

export const createBooking = (launchId: number, body: unknown, authorization: unknown): Booking => {
  const user = readSessionUser(authorization);
  const candidate = isRecord(body) ? body : {};
  rejectForbiddenFields(candidate);
  const name = readText(candidate["name"], NAME_REQUIRED);
  const email = readEmail(candidate["email"]);
  const phone = readText(candidate["phone"], PHONE_REQUIRED);
  assertBookable(loadLaunchSeats(launchId));
  const booking = insertBookingIfSeatFree({
    bookedByUserId: user.id,
    createdAt: new Date().toISOString(),
    email,
    launchId,
    name,
    phone,
  });
  if (!booking) {
    assertBookable(loadLaunchSeats(launchId));
    throw new ApiError(409, NO_SEATS);
  }
  log.info(`Booking created: ${booking.id} on launch ${launchId}`);
  return booking;
};

export const listBookings = (launchId: number, authorization: unknown): LaunchBookings => {
  readSessionUser(authorization);
  const seats = loadLaunchSeats(launchId);
  const bookings = listBookingsByLaunch(launchId);
  return {
    bookings,
    capacity: seats.capacity,
    free: Math.max(seats.capacity - bookings.length, 0),
    taken: bookings.length,
  };
};
