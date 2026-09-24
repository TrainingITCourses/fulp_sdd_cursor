import type { Route } from "../core/create-router.js";
import { appTitle } from "../shared/global.js";

export const routes: Route[] = [
  {
    load: () => import("./home-page.component.js").then((m) => m.tagName),
    menu: { href: "/", label: "Home" },
    pattern: new URLPattern({ pathname: "/" }),
    title: appTitle,
  },
  {
    load: () => import("./about-page.component.js").then((m) => m.tagName),
    menu: { href: "/about", label: "About" },
    pattern: new URLPattern({ pathname: "/about" }),
    title: `About — ${appTitle}`,
  },
  {
    load: () => import("./item-detail-page.component.js").then((m) => m.tagName),
    pattern: new URLPattern({ pathname: "/items/:itemId" }),
    title: "Item — Details",
  },
  {
    load: () => import("./register-page.component.js").then((m) => m.tagName),
    pattern: new URLPattern({ pathname: "/register" }),
    title: `Register — ${appTitle}`,
  },
  {
    load: () => import("./login-page.component.js").then((m) => m.tagName),
    pattern: new URLPattern({ pathname: "/login" }),
    title: `Log in — ${appTitle}`,
  },
];

export const menuLinks = routes.flatMap((route) => (route.menu ? [route.menu] : []));

export const notFoundRoute: Readonly<Route> = {
  load: () => import("./not-found-page.component.js").then((m) => m.tagName),
  pattern: new URLPattern({ pathname: "*" }),
  title: "Not found ",
};
