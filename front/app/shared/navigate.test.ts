import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import { goTo } from "./navigate.js";

interface GlobalWithBrowserApis {
  navigation?: { navigate: (path: string) => void };
  location?: { assign: (path: string) => void };
}

// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const globals = globalThis as GlobalWithBrowserApis;

afterEach(() => {
  delete globals.navigation;
  delete globals.location;
});

void describe("goTo", () => {
  void test("navigates through the Navigation API when it is available", () => {
    const calls: string[] = [];
    globals.navigation = {
      navigate: (path) => {
        calls.push(path);
      },
    };
    goTo("/login?registered=1");
    assert.deepEqual(calls, ["/login?registered=1"]);
  });

  void test("falls back to a full navigation when the Navigation API is unavailable", () => {
    const calls: string[] = [];
    globals.location = {
      assign: (path) => {
        calls.push(path);
      },
    };
    goTo("/register");
    assert.deepEqual(calls, ["/register"]);
  });
});
