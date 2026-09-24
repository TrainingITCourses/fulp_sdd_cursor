export interface AppAuthor {
  name: string;
  url?: string;
}

declare global {
  var APP_TITLE: string;
  var APP_AUTHOR: AppAuthor | null;
}

/** Application display name, supplied by the server from package.json. */
export const appTitle = globalThis.APP_TITLE;

/** Application author, supplied by the server from package.json (null when not declared). */
export const appAuthor = globalThis.APP_AUTHOR;
