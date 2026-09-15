import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { createStore } from "./create-store.js";

// Minimal localStorage stub so the persist branch is testable outside the browser.
function createLocalStorageStub(): Storage {
  const data = new Map<string, string>();
  return {
    clear: () => { data.clear(); },
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
  const store = createStore("count", 0);
  assert.equal(store.get(), 0);
});

void test("set updates the value and notifies subscribers", () => {
  const store = createStore("count", 0),
    seen: number[] = [];
  store.subscribe((value) => seen.push(value));

  store.set(5);

  assert.equal(store.get(), 5);
  assert.deepEqual(seen, [5]);
});

void test("subscribe's returned function stops further notifications", () => {
  const store = createStore("count", 0),
    seen: number[] = [],
    unsubscribe = store.subscribe((value) => seen.push(value));
  unsubscribe();

  store.set(1);

  assert.deepEqual(seen, []);
});

void test("persist: true restores a previously stored value", () => {
  localStorage.setItem("count", JSON.stringify(42));

  const store = createStore("count", 0, { persist: true });

  assert.equal(store.get(), 42);
});

void test("persist: true writes updates to localStorage", () => {
  const store = createStore("count", 0, { persist: true });

  store.set(7);

  assert.equal(localStorage.getItem("count"), "7");
});

void test("persist: true keeps the initial value when storage is corrupt", () => {
  localStorage.setItem("count", "{not json");

  const store = createStore("count", 0, { persist: true });

  assert.equal(store.get(), 0);
});
