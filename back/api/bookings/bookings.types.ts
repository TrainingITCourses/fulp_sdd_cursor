/** Wire format of a booking. One booking takes one seat. */
export interface Booking {
  id: number;
  launchId: number;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

/** Wire format of the bookings of a launch, ordered by `createdAt`. */
export interface LaunchBookings {
  capacity: number;
  taken: number;
  free: number;
  bookings: Booking[];
}

export interface LaunchSeats {
  id: number;
  status: string;
  capacity: number;
  taken: number;
}

export interface InsertBookingParams {
  launchId: number;
  name: string;
  email: string;
  phone: string;
  bookedByUserId: number;
  createdAt: string;
}

export interface SessionUser {
  id: number;
}
