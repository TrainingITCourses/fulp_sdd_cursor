import express from "express";
import { clientSrc, port } from "./server/config.js";
import { serveIndexHtml } from "./server/indexHtml.js";
import { listen } from "./server/listener.js";
import { handleSplatRoute } from "./server/splat-route.js";
import { serveTsAsJs } from "./server/ts-middleware.js";

const app = express();
app.use(serveTsAsJs);
app.use(express.static(clientSrc, { index: false }));
app.get("/", serveIndexHtml);
app.get("*splat", handleSplatRoute);

listen(app, port);
