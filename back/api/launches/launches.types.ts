export const LAUNCH_STATUSES = ["planned", "confirmed", "successful", "cancelled"] as const;

export type LaunchStatus = (typeof LAUNCH_STATUSES)[number];

/** Wire format of a launch. This delivery only creates status planned. */
export interface Launch {
  id: number;
  rocketId: number;
  scheduledAt: string;
  pricePerPassenger: number;
  status: LaunchStatus;
  createdAt: string;
}

export interface LaunchRecord {
  id: number;
  rocketId: number;
  scheduledAt: string;
  pricePerPassenger: number;
  status: string;
  createdAt: string;
}

export interface InsertLaunchParams {
  rocketId: number;
  scheduledAt: string;
  pricePerPassenger: number;
}

export interface RocketAvailability {
  id: number;
  disabled: boolean;
}
