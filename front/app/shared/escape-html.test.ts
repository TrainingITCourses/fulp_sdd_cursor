import assert from "node:assert/strict";
import { test } from "node:test";
import { escapeHtml } from "./escape-html.js";

void test("escapeHtml escapes markup and attribute delimiters", () => {
  assert.equal(
    escapeHtml(`<img src="x" onerror='a&b'>`),
    "&lt;img src=&quot;x&quot; onerror=&#39;a&amp;b&#39;&gt;",
  );
});

void test("escapeHtml leaves plain text unchanged", () => {
  assert.equal(escapeHtml("Item 42"), "Item 42");
});
