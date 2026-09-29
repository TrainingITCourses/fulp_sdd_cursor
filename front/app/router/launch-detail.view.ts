import { escapeHtml } from "../core/escape-html.js";
import type { LaunchBookings } from "../shared/repositories/bookings.repository.js";
import type { CancellationCauseType, Launch } from "../shared/repositories/launches.repository.js";

export const CAUSE_LABEL: Record<CancellationCauseType, string> = {
  economic: "Económico",
  meteorological: "Meteorológico",
  technical: "Técnico",
};

const STATUS_LABEL: Record<Launch["status"], string> = {
  planned: "Planned",
  confirmed: "Confirmed",
  successful: "Successful",
  cancelled: "Cancelled",
};

export const showsCancelForm = (status: Launch["status"]): boolean =>
  status === "planned" || status === "confirmed";

export const showsBookingForm = (status: Launch["status"], free: number): boolean =>
  status === "planned" && free > 0;

export const showsCancelBooking = (status: Launch["status"]): boolean => status === "planned";

export interface LaunchDetailView {
  statusLabel: string;
  showForm: boolean;
  causeTypeLabel?: string;
  causeText?: string;
  cancelledAt?: string;
  cancelledBy?: string;
}

export const launchDetailView = (launch: Readonly<Launch>): LaunchDetailView => {
  const view: LaunchDetailView = {
    showForm: showsCancelForm(launch.status),
    statusLabel: STATUS_LABEL[launch.status],
  };
  const cancellation = launch.cancellation;
  if (!cancellation) return view;
  view.causeTypeLabel = CAUSE_LABEL[cancellation.causeType];
  view.causeText = cancellation.causeText;
  view.cancelledAt = cancellation.cancelledAt;
  view.cancelledBy = cancellation.cancelledBy.name;
  return view;
};

const renderFacts = (
  launch: Readonly<Launch>,
  rocketLabel: string,
  view: LaunchDetailView,
): string => `
  <ab-page-header heading="Launch #${launch.id}"></ab-page-header>
  <p>Rocket: <span id="launch-rocket">${escapeHtml(rocketLabel)}</span></p>
  <p>Date: <span id="launch-date">${escapeHtml(launch.scheduledAt)}</span></p>
  <p>Price per passenger: <span id="launch-price">${launch.pricePerPassenger}</span></p>
  <p>Status: <span id="launch-status">${escapeHtml(view.statusLabel)}</span></p>`;

const renderCancellation = (view: LaunchDetailView): string => {
  if (!view.causeTypeLabel || !view.causeText || !view.cancelledAt || !view.cancelledBy) return "";
  return `
    <p>Cause: <span id="launch-cause-type">${escapeHtml(view.causeTypeLabel)}</span></p>
    <p>Details: <span id="launch-cause-text">${escapeHtml(view.causeText)}</span></p>
    <p>Cancelled at: <span id="launch-cancelled-at">${escapeHtml(view.cancelledAt)}</span></p>
    <p>Cancelled by: <span id="launch-cancelled-by">${escapeHtml(view.cancelledBy)}</span></p>`;
};

const renderCancelForm = (showForm: boolean): string => {
  if (!showForm) return "";
  return `
    <form id="cancel-form">
      <label for="cancel-cause-type">Cause type</label>
      <select id="cancel-cause-type" name="causeType" required>
        <option value="economic">Económico</option>
        <option value="meteorological">Meteorológico</option>
        <option value="technical">Técnico</option>
      </select>
      <label for="cancel-cause-text">Cause</label>
      <textarea id="cancel-cause-text" name="causeText" required></textarea>
      <button type="submit">Cancel launch</button>
    </form>
    <p id="cancel-error" role="alert"></p>`;
};

const renderCancelBookingCell = (bookingId: number, canCancel: boolean): string => {
  if (!canCancel) return "";
  return `
          <td>
            <button type="button" class="secondary" data-cancel-booking="${bookingId}">
              Cancel booking
            </button>
          </td>`;
};

const renderPassengers = (seats: Readonly<LaunchBookings>, canCancel: boolean): string => {
  const freeText = seats.free > 0 ? `${seats.free} of ${seats.capacity}` : "No seats left";
  const rows = seats.bookings
    .map(
      (booking) => `
        <tr>
          <td>${escapeHtml(booking.name)}</td>
          <td>${escapeHtml(booking.email)}</td>
          <td>${escapeHtml(booking.phone)}</td>${renderCancelBookingCell(booking.id, canCancel)}
        </tr>`,
    )
    .join("");
  const actionHeader = canCancel ? "<th>Actions</th>" : "";
  const table =
    seats.bookings.length === 0
      ? `<p id="launch-no-passengers">No passengers yet.</p>`
      : `
    <table id="launch-passengers">
      <thead><tr><th>Name</th><th>Email</th><th>Phone</th>${actionHeader}</tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  const cancelError = canCancel ? `<p id="booking-cancel-error" role="alert"></p>` : "";
  return `
    <h2>Passengers</h2>
    <p>Free seats: <span id="launch-free-seats">${escapeHtml(freeText)}</span></p>${table}${cancelError}`;
};

const renderBookingForm = (showForm: boolean): string => {
  if (!showForm) return "";
  return `
    <form id="booking-form">
      <label for="booking-name">Passenger name</label>
      <input id="booking-name" name="name" required />
      <label for="booking-email">Passenger email</label>
      <input id="booking-email" name="email" type="email" required />
      <label for="booking-phone">Passenger phone</label>
      <input id="booking-phone" name="phone" type="tel" required />
      <button type="submit">Book seat</button>
    </form>
    <p id="booking-error" role="alert"></p>`;
};

export const renderLaunchDetail = (
  launch: Readonly<Launch>,
  rocketLabel: string,
  seats: Readonly<LaunchBookings>,
): string => {
  const view = launchDetailView(launch);
  const bookingForm = renderBookingForm(showsBookingForm(launch.status, seats.free));
  return `${renderFacts(launch, rocketLabel, view)}${renderCancellation(view)}${renderPassengers(seats, showsCancelBooking(launch.status))}${bookingForm}${renderCancelForm(view.showForm)}
    <p><a href="/launches">Back to launches</a></p>`;
};
