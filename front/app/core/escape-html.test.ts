import assert from "node:assert/strict";
import { test } from "node:test";
import { escapeHtml } from "./escape-html.js";

void test("escapes characters with special meaning in HTML", () => {
  assert.equal(
    escapeHtml(`<script data-value="'&">alert(1)</script>`),
    "&lt;script data-value=&quot;&#39;&amp;&quot;&gt;alert(1)&lt;/script&gt;",
  );
});

void test("leaves ordinary text unchanged", () => {
  assert.equal(escapeHtml("Item 42 — ready"), "Item 42 — ready");
});
