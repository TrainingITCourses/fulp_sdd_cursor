import type { NextFunction, Request, Response } from "express";
import type { Logger } from "./logger.js";

const HTTP_CLIENT_ERROR = 400;
const HTTP_SERVER_ERROR = 500;

/** Express middleware that logs one line per request once the response finishes. */
export const logHttpRequests =
  (logger: Logger) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const start = performance.now();
    res.on("finish", () => {
      const durationMs = Math.round(performance.now() - start);
      const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`;
      if (res.statusCode >= HTTP_SERVER_ERROR) {
        logger.error(message);
      } else if (res.statusCode >= HTTP_CLIENT_ERROR) {
        logger.warn(message);
      } else {
        logger.info(message);
      }
    });
    next();
  };
