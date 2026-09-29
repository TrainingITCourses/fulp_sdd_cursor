import { get, post } from "../http-client.js";

export interface Booking {
  id: number;
  launchId: number;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface LaunchBookings {
  capacity: number;
  taken: number;
  free: number;
  bookings: Booking[];
}

export interface BookingWrite {
  name: string;
  email: string;
  phone: string;
}

export const listBookings = (launchId: string): Promise<LaunchBookings> =>
  get<LaunchBookings>(`/api/launches/${launchId}/bookings`);

export const createBooking = (launchId: string, body: Readonly<BookingWrite>): Promise<Booking> =>
  post<Booking>(`/api/launches/${launchId}/bookings`, body);
