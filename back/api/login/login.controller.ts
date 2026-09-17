import type { NextFunction, Request, Response } from "express";
import { getCurrentUser, loginUser } from "./login.service.js";

export const postLogin = async (
  req: Readonly<Request>,
  res: Readonly<Response>,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await loginUser(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getMe = (
  req: Readonly<Request>,
  res: Readonly<Response>,
  next: NextFunction,
): void => {
  try {
    const profile = getCurrentUser(req.headers.authorization);
    res.json(profile);
  } catch (err) {
    next(err);
  }
};
