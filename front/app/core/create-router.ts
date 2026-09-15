export interface MenuLink {
  href: string;
  label: string;
}

export interface Route {
  pattern: URLPattern;
  title: string;
  load: () => Promise<string>; // Resolves to the custom-element tag name
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
function toAttributeName(paramName: string): string {
  return paramName.replaceAll(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function findRoute(url: URL, config: RouterConfig): Route {
  return config.routes.find((route) => route.pattern.test(url)) ?? config.notFound;
}

function applyRouteParams(page: HTMLElement, params: Record<string, string | undefined>): void {
  for (const [name, value] of Object.entries(params)) {
    // Wildcard groups are numeric ("0") — not valid attribute names.
    if (value !== undefined && /^[a-z]/i.test(name)) {
      page.setAttribute(toAttributeName(name), value);
    }
  }
}

async function render(url: URL, config: RouterConfig): Promise<void> {
  const navigationId = (latestNavigationId += 1),
    route = findRoute(url, config),
    params = route.pattern.exec(url)?.pathname.groups ?? {},
    tag = await route.load();

  // A newer navigation started while this one's component was loading — drop this one.
  if (navigationId !== latestNavigationId) {
    return;
  }

  const page = document.createElement(tag);
  applyRouteParams(page, params);

  config.outlet.replaceChildren(page);
  document.title = route.title;
  window.scrollTo(0, 0);
  config.outlet.focus();
  config.onNavigated?.(url);
}

export function createRouter(config: RouterConfig): void {
  config.outlet.tabIndex = -1; // Focus target after each navigation

  if ("navigation" in globalThis) {
    navigation.addEventListener("navigate", (event) => {
      // Let the browser handle downloads, same-page hash jumps, and
      // Anything it refuses to intercept (cross-origin, etc.).
      if (!event.canIntercept || event.hashChange || event.downloadRequest !== null) {
        return;
      }

      const url = new URL(event.destination.url);
      event.intercept({ handler: async () => render(url, config) });
    });
  }

  render(new URL(globalThis.location.href), config).catch(() => {});
}
