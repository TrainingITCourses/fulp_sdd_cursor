import type { Request, Response } from "express";
import { ApiError } from "../../shared/errors.js";
import { createLogger } from "../../shared/logger.js";
import { coerceToFiniteNumber } from "../../shared/type.utils.js";
import { cancelBooking, createBooking, listBookings } from "./bookings.service.js";

const CREATED = 201;
const NO_CONTENT = 204;
const log = createLogger("bookings");

const authorizationOf = (req: Readonly<Request>): unknown => req.header("authorization");

const positiveIdOf = (req: Readonly<Request>, param: string, message: string): number => {
  const id = coerceToFiniteNumber(req.params[param], Number.NaN);
  if (!Number.isInteger(id) || id <= 0) {
    log.warn(`Invalid ${param}: ${String(req.params[param])}`);
    throw new ApiError(404, message);
  }
  return id;
};

const launchIdOf = (req: Readonly<Request>): number =>
  positiveIdOf(req, "launchId", "Launch not found");

const bookingIdOf = (req: Readonly<Request>): number =>
  positiveIdOf(req, "bookingId", "Booking not found");

export const postBooking = (req: Readonly<Request>, res: Readonly<Response>): void => {
  const booking = createBooking(launchIdOf(req), req.body, authorizationOf(req));
  res.status(CREATED).json(booking);
};

export const getBookings = (req: Readonly<Request>, res: Readonly<Response>): void => {
  res.json(listBookings(launchIdOf(req), authorizationOf(req)));
};

export const deleteBooking = (req: Readonly<Request>, res: Readonly<Response>): void => {
  cancelBooking(launchIdOf(req), bookingIdOf(req), authorizationOf(req));
  res.status(NO_CONTENT).end();
};
