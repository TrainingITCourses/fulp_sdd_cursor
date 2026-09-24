/** Navigates to `path` using the Navigation API when available, or a full document navigation otherwise. */
export const goTo = (path: string): void => {
  if ("navigation" in globalThis) {
    navigation.navigate(path);
  } else {
    location.assign(path);
  }
};
