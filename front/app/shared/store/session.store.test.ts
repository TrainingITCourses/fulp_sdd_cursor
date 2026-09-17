import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import type { Session } from "./session.store.js";

const TEST_SESSION: Session = {
  token: "tok-1",
  user: { email: "ada@astro.test", id: 1, name: "Ada" },
};

function createLocalStorageStub(): Storage {
  const data = new Map<string, string>();
  return {
    clear: () => {
      data.clear();
    },
    getItem: (key: string) => data.get(key) ?? null,
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
  globalThis.localStorage = undefined as unknown as Storage;
});

void test("sessionStore persists token and user after login", async () => {
  const { sessionStore } = await import("./session.store.js");

  assert.equal(sessionStore.get(), undefined);

  sessionStore.set(TEST_SESSION);

  assert.deepEqual(sessionStore.get(), TEST_SESSION);
  assert.equal(localStorage.getItem("session"), JSON.stringify(TEST_SESSION));
});
