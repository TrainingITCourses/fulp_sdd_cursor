import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// Keep test runs from writing into ./logs.
process.env["LOG_DIR"] = mkdtempSync(path.join(tmpdir(), "front-standard-logs-"));

const memory = new Map<string, string>();
globalThis.localStorage = {
  clear: () => {
    memory.clear();
  },
  getItem: (key: string) => memory.get(key) ?? null,
  key: (index: number) => [...memory.keys()][index] ?? null,
  get length() {
    return memory.size;
  },
  removeItem: (key: string) => {
    memory.delete(key);
  },
  setItem: (key: string, value: string) => {
    memory.set(key, value);
  },
};
