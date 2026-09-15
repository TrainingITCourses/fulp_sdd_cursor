import { get } from "../http-client.js";
export interface HealthStatus {
  uptime: number;
  runs: number;
}

export const getHealth = async (): Promise<HealthStatus> => get<HealthStatus>("/api/health");
