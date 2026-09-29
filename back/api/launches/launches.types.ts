export const LAUNCH_STATUSES = ["planned", "confirmed", "successful", "cancelled"] as const;

export type LaunchStatus = (typeof LAUNCH_STATUSES)[number];

export const CANCELLATION_CAUSE_TYPES = ["economic", "meteorological", "technical"] as const;

export type CancellationCauseType = (typeof CANCELLATION_CAUSE_TYPES)[number];

export interface CancellationActor {
  id: number;
  name: string;
}

/** Recorded once, when a launch is cancelled. */
export interface Cancellation {
  causeType: CancellationCauseType;
  causeText: string;
  cancelledAt: string;
  cancelledBy: CancellationActor;
}

/** Wire format of a launch. `cancellation` is null until the launch is cancelled. */
export interface Launch {
  id: number;
  rocketId: number;
  scheduledAt: string;
  pricePerPassenger: number;
  status: LaunchStatus;
  createdAt: string;
  cancellation: Cancellation | null;
}

export interface LaunchRecord {
  id: number;
  rocketId: number;
  scheduledAt: string;
  pricePerPassenger: number;
  status: string;
  createdAt: string;
  cancellationCauseType: string | null;
  cancellationCauseText: string | null;
  cancelledAt: string | null;
  cancelledByUserId: number | null;
  cancelledByName: string | null;
}

export interface InsertLaunchParams {
  rocketId: number;
  scheduledAt: string;
  pricePerPassenger: number;
}

export interface CancelLaunchParams {
  id: number;
  causeType: string;
  causeText: string;
  cancelledAt: string;
  cancelledByUserId: number;
}

export interface SessionUser {
  id: number;
  name: string;
}

export interface RocketAvailability {
  id: number;
  disabled: boolean;
}
