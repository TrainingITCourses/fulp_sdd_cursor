import type { Request, Response } from "express";
import { ApiError } from "../../shared/errors.js";
import { createLogger } from "../../shared/logger.js";
import { coerceToFiniteNumber } from "../../shared/type.utils.js";
import { createBooking, listBookings } from "./bookings.service.js";

const CREATED = 201;
const log = createLogger("bookings");

const authorizationOf = (req: Readonly<Request>): unknown => req.header("authorization");

const launchIdOf = (req: Readonly<Request>): number => {
  const id = coerceToFiniteNumber(req.params["launchId"], Number.NaN);
  if (!Number.isInteger(id) || id <= 0) {
    log.warn(`Invalid launch id: ${String(req.params["launchId"])}`);
    throw new ApiError(404, "Launch not found");
  }
  return id;
};

export const postBooking = (req: Readonly<Request>, res: Readonly<Response>): void => {
  const booking = createBooking(launchIdOf(req), req.body, authorizationOf(req));
  res.status(CREATED).json(booking);
};

export const getBookings = (req: Readonly<Request>, res: Readonly<Response>): void => {
  res.json(listBookings(launchIdOf(req), authorizationOf(req)));
};
