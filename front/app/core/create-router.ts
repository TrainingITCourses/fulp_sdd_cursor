export interface MenuLink {
  href: string;
  label: string;
}

export interface Route {
  pattern: URLPattern;
  title: string;
  // Resolves to the custom-element tag name
  load: () => Promise<string>;
  menu?: MenuLink;
}

export interface RouterConfig {
  outlet: HTMLElement;
  routes: Route[];
  notFound: Route;
  onNavigated?: (url: URL) => void;
}

let latestNavigationId = 0;

// Attribute names are case-insensitive: itemId -> item-id
const toAttributeName = (paramName: string): string => {
  return paramName.replaceAll(/[A-Z]/gu, (letter) => `-${letter.toLowerCase()}`);
};

const findRoute = (url: URL, config: Readonly<RouterConfig>): Route => {
  return config.routes.find((route) => route.pattern.test(url)) ?? config.notFound;
};

const applyRouteParams = (
  page: HTMLElement,
  params: Readonly<Record<string, string | undefined>>,
): void => {
  for (const [name, value] of Object.entries(params)) {
    // Wildcard groups are numeric ("0") — not valid attribute names.
    if (value !== undefined && /^[a-z]/iu.test(name)) {
      page.setAttribute(toAttributeName(name), value);
    }
  }
};

const renderPage = (
  tag: string,
  params: Readonly<Record<string, string | undefined>>,
  config: Readonly<RouterConfig>,
  route: Readonly<Route>,
): void => {
  const page = document.createElement(tag);
  applyRouteParams(page, params);
  config.outlet.replaceChildren(page);
  document.title = route.title;
  config.outlet.focus();
  config.onNavigated?.(new URL(globalThis.location.href));
};

const render = async (url: URL, config: Readonly<RouterConfig>): Promise<void> => {
  const FIRST_NAVIGATION_ID = 1;
  const navigationId = (latestNavigationId += FIRST_NAVIGATION_ID);
  const route = findRoute(url, config);
  const params = route.pattern.exec(url)?.pathname.groups ?? {};
  const tag = await route.load();

  if (navigationId !== latestNavigationId) {
    return;
  }

  renderPage(tag, params, config, route);
  const SCROLL_TOP = 0;
  window.scrollTo(SCROLL_TOP, SCROLL_TOP);
};

export const createRouter = (config: Readonly<RouterConfig>): void => {
  const FOCUS_TARGET_OFFSET = -1;
  // Focus target after each navigation
  config.outlet.tabIndex = FOCUS_TARGET_OFFSET;

  if ("navigation" in globalThis) {
    navigation.addEventListener("navigate", (event) => {
      if (!event.canIntercept || event.hashChange || event.downloadRequest !== null) {
        return;
      }
      const url = new URL(event.destination.url);
      event.intercept({ handler: () => render(url, config) });
    });
  }

  render(new URL(globalThis.location.href), config).catch(() => {});
};
