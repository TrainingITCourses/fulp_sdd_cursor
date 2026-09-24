import express from "express";
import { clientSrc, port } from "./server/config.js";
import { logHttpRequests } from "./server/http-logger.js";
import { serveIndexHtml } from "./server/indexHtml.js";
import { listen } from "./server/listener.js";
import { createLogger } from "./server/logger.js";
import { handleSplatRoute } from "./server/splat-route.js";
import { serveTsAsJs } from "./server/ts-middleware.js";

const app = express();
app.use(logHttpRequests(createLogger("http")));
app.use(serveTsAsJs);
app.use(express.static(clientSrc, { index: false }));
app.get("/", serveIndexHtml);
app.get("*splat", handleSplatRoute);

listen(app, port);
