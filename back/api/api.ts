import { Router } from "express";
import { postLogin, postRegister } from "./auth/auth.controller.js";
import { getHealth } from "./health/health.controller.js";
import {
  getRocketById,
  getRockets,
  patchRocket,
  postDisableRocket,
  postRocket,
} from "./rockets/rockets.controller.js";

const createRouter = Router;
export const apiRouter: Router = createRouter();

apiRouter.get("/health", getHealth);
apiRouter.post("/auth/register", postRegister);
apiRouter.post("/auth/login", postLogin);
apiRouter.post("/rockets", postRocket);
apiRouter.get("/rockets", getRockets);
apiRouter.get("/rockets/:rocketId", getRocketById);
apiRouter.patch("/rockets/:rocketId", patchRocket);
apiRouter.post("/rockets/:rocketId/disable", postDisableRocket);
