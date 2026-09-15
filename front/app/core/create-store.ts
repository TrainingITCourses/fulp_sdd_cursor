type Listener<T> = (value: T) => void;

interface StoreOptions {
  persist?: boolean;
}

export interface Store<T> {
  get: () => T;
  set: (next: T) => void;
  subscribe: (listener: Listener<T>) => () => void;
}

export function createStore<T>(key: string, initial?: T, options: StoreOptions = {}): Store<T> {
  // `initial` is optional so persisted stores can be created without passing `undefined`.
  let value = initial as T;

  if (options.persist) {
    const stored = localStorage.getItem(key);
    if (stored !== null) {
      try {
        // The persisted shape is only ever what a previous `set(value)` wrote for this key.
        // There's no independent schema to validate against, so the cast can't be avoided.
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion
        value = JSON.parse(stored) as T;
      } catch {
        // Corrupt entry — keep the initial value
      }
    }
  }

  const listeners = new Set<Listener<T>>();

  return {
    get(): T {
      return value;
    },
    set(next: T): void {
      value = next;
      if (options.persist) {
        localStorage.setItem(key, JSON.stringify(next));
      }
      for (const listener of listeners) {
        listener(next);
      }
    },
    subscribe(listener: Listener<T>): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
