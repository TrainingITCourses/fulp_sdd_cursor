import type { Route } from "../core/create-router.js";
import { appTitle } from "../shared/global.js";

export const routes: Route[] = [
  {
    load: async () => import("./home-page.component.js").then((m) => m.tagName),
    menu: { href: "/", label: "Home" },
    pattern: new URLPattern({ pathname: "/" }),
    title: appTitle,
  },
  {
    load: async () => import("./about-page.component.js").then((m) => m.tagName),
    menu: { href: "/about", label: "About" },
    pattern: new URLPattern({ pathname: "/about" }),
    title: `About — ${appTitle}`,
  },
  {
    load: async () => import("./item-detail-page.component.js").then((m) => m.tagName),
    pattern: new URLPattern({ pathname: "/items/:itemId" }),
    title: "Item — Details",
  },
];

export const menuLinks = routes.flatMap((route) => (route.menu ? [route.menu] : []));

export const notFoundRoute: Route = {
  load: async () => import("./not-found-page.component.js").then((m) => m.tagName),
  pattern: new URLPattern({ pathname: "*" }),
  title: "Not found ",
};
