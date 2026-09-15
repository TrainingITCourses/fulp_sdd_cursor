import type { HealthStatus } from "../repositories/health.repository.js";
import { createStore } from "../../core/create-store.js";

/** In-memory cache of the last /api/health payload. */
export const healthStore = createStore<HealthStatus | undefined>("health");
