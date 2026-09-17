const htmlEntities: Readonly<Record<string, string>> = {
  '"': "&quot;",
  "&": "&amp;",
  "'": "&#39;",
  "<": "&lt;",
  ">": "&gt;",
};

/** Escapes a value before interpolating it into `innerHTML` markup or attributes. */
export const escapeHtml = (value: string): string =>
  value.replaceAll(/["&'<>]/gu, (char: string) => htmlEntities[char] ?? char);
