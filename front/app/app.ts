import { createLogger } from "./core/create-logger.js";
import { createRouter } from "./core/create-router.js";
import { notFoundRoute, routes } from "./router/routes.js";
import "./shared/components/nav-menu.component.js";
import { lastRouteStore } from "./shared/store/last-route.store.js";

const logger = createLogger("router");
const outlet = document.querySelector<HTMLElement>("#outlet");
// Resume the last visited route when landing on the root of a fresh session.
const lastRoute = lastRouteStore.get();
if (location.pathname === "/" && lastRoute !== "/") {
  history.replaceState(undefined, "", lastRoute);
}

if (outlet) {
  createRouter({
    notFound: notFoundRoute,
    onNavigated: (url: URL) => {
      logger.info(`Navigated to ${url.pathname}`);
      lastRouteStore.set(url.pathname);
    },
    outlet,
    routes,
  });
} else {
  logger.error("Missing #outlet element; the router cannot start");
}
