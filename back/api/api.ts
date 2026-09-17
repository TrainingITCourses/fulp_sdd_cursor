import { Router } from "express";
import { getHealth } from "./health/health.controller.js";
import { getMe, postLogin } from "./login/login.controller.js";
import { postRegister } from "./register/register.controller.js";

const createRouter = Router;
export const apiRouter: Router = createRouter();

apiRouter.get("/health", getHealth);
apiRouter.post("/register", postRegister);
apiRouter.post("/login", postLogin);
apiRouter.get("/me", getMe);
