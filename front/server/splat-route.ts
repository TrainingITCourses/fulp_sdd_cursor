import type { NextFunction, Request, Response } from "express";
import { serveIndexHtml } from "./indexHtml.js";

export const handleSplatRoute = (req: Request, res: Response, next: NextFunction): void => {
  if (req.path.includes(".")) {
    next();
    return;
  }
  serveIndexHtml(req, res);
};
