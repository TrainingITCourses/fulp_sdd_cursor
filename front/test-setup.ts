import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// Keep test runs from writing into ./logs.
process.env["LOG_DIR"] = mkdtempSync(path.join(tmpdir(), "front-standard-logs-"));
