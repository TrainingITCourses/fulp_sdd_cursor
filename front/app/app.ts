import "./shared/components/nav-menu.component.js";
import { notFoundRoute, routes } from "./router/routes.js";
import { createRouter } from "./core/create-router.js";
import { lastRouteStore } from "./shared/store/last-route.store.js";

const outlet = document.querySelector<HTMLElement>("#outlet"),

// Resume the last visited route when landing on the root of a fresh session.
 lastRoute = lastRouteStore.get();
if (location.pathname === "/" && lastRoute !== "/") {
  history.replaceState(undefined, "", lastRoute);
}

if (outlet) {
  createRouter({
    notFound: notFoundRoute,
    onNavigated: (url) =>{  lastRouteStore.set(url.pathname); },
    outlet,
    routes,
  });
}
