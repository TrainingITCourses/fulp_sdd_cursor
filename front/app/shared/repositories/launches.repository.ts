import { get, post } from "../http-client.js";

export type LaunchStatus = "planned" | "confirmed" | "successful" | "cancelled";

export interface Launch {
  id: number;
  rocketId: number;
  scheduledAt: string;
  pricePerPassenger: number;
  status: LaunchStatus;
  createdAt: string;
}

export interface LaunchWrite {
  rocketId: number;
  scheduledAt: string;
  pricePerPassenger: number;
}

export const listLaunches = (): Promise<Launch[]> => get<Launch[]>("/api/launches");

export const getLaunch = (launchId: string): Promise<Launch> =>
  get<Launch>(`/api/launches/${launchId}`);

export const createLaunch = (body: Readonly<LaunchWrite>): Promise<Launch> =>
  post<Launch>("/api/launches", body);
