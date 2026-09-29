import { get, post } from "../http-client.js";

export type LaunchStatus = "planned" | "confirmed" | "successful" | "cancelled";

export type CancellationCauseType = "economic" | "meteorological" | "technical";

export interface Cancellation {
  causeType: CancellationCauseType;
  causeText: string;
  cancelledAt: string;
  cancelledBy: { id: number; name: string };
}

export interface Launch {
  id: number;
  rocketId: number;
  scheduledAt: string;
  pricePerPassenger: number;
  status: LaunchStatus;
  createdAt: string;
  cancellation: Cancellation | null;
}

export interface LaunchWrite {
  rocketId: number;
  scheduledAt: string;
  pricePerPassenger: number;
}

export interface CancelLaunchWrite {
  causeType: CancellationCauseType;
  causeText: string;
}

export const listLaunches = (): Promise<Launch[]> => get<Launch[]>("/api/launches");

export const getLaunch = (launchId: string): Promise<Launch> =>
  get<Launch>(`/api/launches/${launchId}`);

export const createLaunch = (body: Readonly<LaunchWrite>): Promise<Launch> =>
  post<Launch>("/api/launches", body);

export const cancelLaunch = (
  launchId: string,
  body: Readonly<CancelLaunchWrite>,
): Promise<Launch> => post<Launch>(`/api/launches/${launchId}/cancel`, body);
