import { get, patch, post } from "../http-client.js";

export type RocketRange = "earth" | "moon" | "mars";

export interface Rocket {
  id: number;
  name: string;
  range: RocketRange;
  capacity: number;
  disabled: boolean;
  createdAt: string;
}

export interface RocketWrite {
  name: string;
  range: RocketRange;
}

export const listRockets = (): Promise<Rocket[]> => get<Rocket[]>("/api/rockets");

export const getRocket = (rocketId: string): Promise<Rocket> =>
  get<Rocket>(`/api/rockets/${rocketId}`);

export const createRocket = (body: Readonly<RocketWrite>): Promise<Rocket> =>
  post<Rocket>("/api/rockets", body);

export const updateRocket = (rocketId: string, body: Readonly<RocketWrite>): Promise<Rocket> =>
  patch<Rocket>(`/api/rockets/${rocketId}`, body);

export const disableRocket = (rocketId: string): Promise<Rocket> =>
  post<Rocket>(`/api/rockets/${rocketId}/disable`, {});
