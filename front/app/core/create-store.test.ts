import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { createStore } from "./create-store.js";

// Named constants for test values
const INITIAL_COUNT = 0;
const TEST_COUNT_FIVE = 5;
const TEST_COUNT_ONE = 1;
const TEST_COUNT_FORTY_TWO = 42;
const TEST_COUNT_SEVEN = 7;

// Minimal localStorage stub so the persist branch is testable outside the browser.
function createLocalStorageStub(): Storage {
  const data = new Map<string, string>();
  return {
    clear: () => {
      data.clear();
    },
    // The built-in Storage interface returns `null` for a missing entry — not
    // `undefined` — so the stub has to match that contract.
    // oxlint-disable-next-line unicorn/no-null
    getItem: (key: string) => data.get(key) ?? null,
    // oxlint-disable-next-line unicorn/no-null
    key: (index: number) => [...data.keys()][index] ?? null,
    get length() {
      return data.size;
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

beforeEach(() => {
  globalThis.localStorage = createLocalStorageStub();
});

afterEach(() => {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  globalThis.localStorage = undefined as unknown as Storage;
});

void test("get returns the initial value", () => {
  const store = createStore("count", INITIAL_COUNT);
  assert.equal(store.get(), INITIAL_COUNT);
});

void test("set updates the value and notifies subscribers", () => {
  const store = createStore("count", INITIAL_COUNT);
  const seen: number[] = [];
  store.subscribe((value) => {
    seen.push(value);
  });

  store.set(TEST_COUNT_FIVE);

  assert.equal(store.get(), TEST_COUNT_FIVE);
  assert.deepEqual(seen, [TEST_COUNT_FIVE]);
});

void test("subscribe's returned function stops further notifications", () => {
  const store = createStore("count", INITIAL_COUNT);
  const seen: number[] = [];
  const unsubscribe = store.subscribe((value) => {
    seen.push(value);
  });
  unsubscribe();

  store.set(TEST_COUNT_ONE);

  assert.deepEqual(seen, []);
});

void test("persist: true restores a previously stored value", () => {
  localStorage.setItem("count", JSON.stringify(TEST_COUNT_FORTY_TWO));

  const store = createStore("count", INITIAL_COUNT, { persist: true });

  assert.equal(store.get(), TEST_COUNT_FORTY_TWO);
});

void test("persist: true writes updates to localStorage", () => {
  const store = createStore("count", INITIAL_COUNT, { persist: true });

  store.set(TEST_COUNT_SEVEN);

  assert.equal(localStorage.getItem("count"), "7");
});

void test("persist: true removes the key when set to undefined", () => {
  const store = createStore<number | undefined>("count", INITIAL_COUNT, { persist: true });
  localStorage.setItem("count", JSON.stringify(TEST_COUNT_SEVEN));

  store.set(undefined);

  assert.equal(localStorage.getItem("count"), null);
});

void test("a store recreated after clearing reads its initial value without parsing", () => {
  const store = createStore<number | undefined>("count", INITIAL_COUNT, { persist: true });
  store.set(undefined);
  const originalParse = JSON.parse;
  let parseCalled = false;
  JSON.parse = (...args: Parameters<typeof JSON.parse>): unknown => {
    parseCalled = true;
    return originalParse(...args);
  };

  try {
    const recreated = createStore<number | undefined>("count", TEST_COUNT_FIVE, { persist: true });
    assert.equal(recreated.get(), TEST_COUNT_FIVE);
    assert.equal(parseCalled, false);
  } finally {
    JSON.parse = originalParse;
  }
});

void test("persist: true with an empty key never touches localStorage", () => {
  const store = createStore("", INITIAL_COUNT, { persist: true });

  store.set(TEST_COUNT_SEVEN);

  assert.equal(localStorage.length, 0);
});

void test("a non-persisted store never touches localStorage", () => {
  const store = createStore("count", INITIAL_COUNT);

  store.set(TEST_COUNT_SEVEN);

  assert.equal(localStorage.length, 0);
});

void test("set undefined still notifies subscribers", () => {
  const store = createStore<number | undefined>("count", INITIAL_COUNT, { persist: true });
  const seen: (number | undefined)[] = [];
  store.subscribe((value) => {
    seen.push(value);
  });

  store.set(undefined);

  assert.deepEqual(seen, [undefined]);
});

void test("persist: true keeps the initial value when storage is corrupt", () => {
  localStorage.setItem("count", "{not json");

  const store = createStore("count", INITIAL_COUNT, { persist: true });

  assert.equal(store.get(), INITIAL_COUNT);
});
