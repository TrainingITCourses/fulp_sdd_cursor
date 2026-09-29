import { Router } from "express";
import { postLogin, postRegister } from "./auth/auth.controller.js";
import { getBookings, postBooking } from "./bookings/bookings.controller.js";
import { getHealth } from "./health/health.controller.js";
import {
  getLaunchById,
  getLaunches,
  postCancelLaunch,
  postLaunch,
} from "./launches/launches.controller.js";
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
apiRouter.post("/launches", postLaunch);
apiRouter.get("/launches", getLaunches);
apiRouter.post("/launches/:launchId/cancel", postCancelLaunch);
apiRouter.post("/launches/:launchId/bookings", postBooking);
apiRouter.get("/launches/:launchId/bookings", getBookings);
apiRouter.get("/launches/:launchId", getLaunchById);
