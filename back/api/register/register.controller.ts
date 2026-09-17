import type { NextFunction, Request, Response } from "express";
import { registerUser } from "./register.service.js";

const HTTP_CREATED = 201;

export const postRegister = async (
  req: Readonly<Request>,
  res: Readonly<Response>,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await registerUser(req.body);
    res.status(HTTP_CREATED).json(result);
  } catch (err) {
    next(err);
  }
};
