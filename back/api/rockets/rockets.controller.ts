import type { Request, Response } from "express";
import { createLogger } from "../../shared/logger.js";
import { coerceToFiniteNumber } from "../../shared/type.utils.js";
import { ApiError } from "../../shared/errors.js";
import {
  createRocket,
  disableRocket,
  getRocket,
  listRockets,
  updateRocket,
} from "./rockets.service.js";

const CREATED = 201;
const log = createLogger("rockets");

const authorizationOf = (req: Readonly<Request>): unknown => req.header("authorization");

const rocketIdOf = (req: Readonly<Request>): number => {
  const id = coerceToFiniteNumber(req.params["rocketId"], Number.NaN);
  if (!Number.isInteger(id) || id <= 0) {
    log.warn(`Invalid rocket id: ${String(req.params["rocketId"])}`);
    throw new ApiError(404, "Rocket not found");
  }
  return id;
};

export const postRocket = (req: Readonly<Request>, res: Readonly<Response>): void => {
  const rocket = createRocket(req.body, authorizationOf(req));
  res.status(CREATED).json(rocket);
};

export const getRockets = (req: Readonly<Request>, res: Readonly<Response>): void => {
  res.json(listRockets(authorizationOf(req)));
};

export const getRocketById = (req: Readonly<Request>, res: Readonly<Response>): void => {
  res.json(getRocket(rocketIdOf(req), authorizationOf(req)));
};

export const patchRocket = (req: Readonly<Request>, res: Readonly<Response>): void => {
  res.json(updateRocket(rocketIdOf(req), req.body, authorizationOf(req)));
};

export const postDisableRocket = (req: Readonly<Request>, res: Readonly<Response>): void => {
  res.json(disableRocket(rocketIdOf(req), authorizationOf(req)));
};
