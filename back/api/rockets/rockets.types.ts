export const ROCKET_CAPACITY = 9;

export const ROCKET_RANGES = ["earth", "moon", "mars"] as const;

export type RocketRange = (typeof ROCKET_RANGES)[number];

/** Wire format of a rocket. Capacity is always 9. */
export interface Rocket {
  id: number;
  name: string;
  range: RocketRange;
  capacity: number;
  disabled: boolean;
  createdAt: string;
}

export interface RocketRecord {
  id: number;
  name: string;
  range: string;
  capacity: number;
  disabled: boolean;
  createdAt: string;
}

export interface InsertRocketParams {
  name: string;
  nameKey: string;
  range: RocketRange;
}

export interface UpdateRocketParams {
  id: number;
  name: string;
  nameKey: string;
  range: RocketRange;
}
