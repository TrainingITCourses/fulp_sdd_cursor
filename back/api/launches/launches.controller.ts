import type { Request, Response } from "express";
import { ApiError } from "../../shared/errors.js";
import { createLogger } from "../../shared/logger.js";
import { coerceToFiniteNumber } from "../../shared/type.utils.js";
import { createLaunch, getLaunch, listLaunches } from "./launches.service.js";

const CREATED = 201;
const log = createLogger("launches");

const authorizationOf = (req: Readonly<Request>): unknown => req.header("authorization");

const launchIdOf = (req: Readonly<Request>): number => {
  const id = coerceToFiniteNumber(req.params["launchId"], Number.NaN);
  if (!Number.isInteger(id) || id <= 0) {
    log.warn(`Invalid launch id: ${String(req.params["launchId"])}`);
    throw new ApiError(404, "Launch not found");
  }
  return id;
};

export const postLaunch = (req: Readonly<Request>, res: Readonly<Response>): void => {
  const launch = createLaunch(req.body, authorizationOf(req));
  res.status(CREATED).json(launch);
};

export const getLaunches = (req: Readonly<Request>, res: Readonly<Response>): void => {
  res.json(listLaunches(authorizationOf(req)));
};

export const getLaunchById = (req: Readonly<Request>, res: Readonly<Response>): void => {
  res.json(getLaunch(launchIdOf(req), authorizationOf(req)));
};
