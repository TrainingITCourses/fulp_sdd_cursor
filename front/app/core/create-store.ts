type Listener<T> = (value: T) => void;

interface StoreOptions {
  persist?: boolean;
}

export interface Store<T> {
  get: () => T;
  set: (next: T) => void;
  subscribe: (listener: Listener<T>) => () => void;
}

function loadPersistedValue<T>(key: string, fallback: T): T {
  if (!key) return fallback;
  const stored = localStorage.getItem(key);
  if (stored === null) return fallback;
  try {
    // The persisted shape is only ever what a previous `set(value)` wrote for this key.
    // There's no independent schema to validate against, so the cast can't be avoided.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return JSON.parse(stored) as T;
  } catch {
    // Corrupt entry — keep the initial value
    return fallback;
  }
}

export function createStore<T>(
  key: string,
  initial?: T,
  options: Readonly<StoreOptions> = {},
): Store<T> {
  // `initial` is optional so persisted stores can be created without passing `undefined`.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  let value = options.persist === true ? loadPersistedValue(key, initial as T) : (initial as T);

  const listeners = new Set<Listener<T>>();

  return {
    get(): T {
      return value;
    },
    set(next: T): void {
      value = next;
      if (options.persist === true) {
        localStorage.setItem(key, JSON.stringify(next));
      }
      for (const listener of listeners) {
        listener(next);
      }
    },
    subscribe(listener: Listener<T>): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
