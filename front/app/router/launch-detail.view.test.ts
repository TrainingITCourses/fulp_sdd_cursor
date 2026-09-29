import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { LaunchBookings } from "../shared/repositories/bookings.repository.js";
import type { Launch } from "../shared/repositories/launches.repository.js";
import {
  launchDetailView,
  renderLaunchDetail,
  showsBookingForm,
  showsCancelBooking,
} from "./launch-detail.view.js";

const launch = (status: Launch["status"], cancellation: Launch["cancellation"]): Launch => ({
  cancellation,
  createdAt: "2026-09-24T00:00:00.000Z",
  id: 4,
  pricePerPassenger: 1200,
  rocketId: 7,
  scheduledAt: "2026-12-01T10:00:00.000Z",
  status,
});

const recorded = {
  cancelledAt: "2026-09-29T16:00:00.000Z",
  cancelledBy: { id: 2, name: "Ada Lovelace" },
  causeText: "Valve leak",
  causeType: "technical" as const,
};

const passenger = (id: number, name: string) => ({
  createdAt: `2026-09-29T17:0${id}:00.000Z`,
  email: `${name.toLowerCase()}@example.com`,
  id,
  launchId: 4,
  name,
  phone: `+34 600 00${id}`,
});

const seats = (taken: number): LaunchBookings => ({
  bookings: Array.from({ length: taken }, (_, index) => passenger(index + 1, `P${index + 1}`)),
  capacity: 9,
  free: 9 - taken,
  taken,
});

const noSeats = seats(0);

void describe("launch detail view", () => {
  void test("asks for a cause on a planned or confirmed launch", () => {
    const planned = launchDetailView(launch("planned", null));
    const confirmed = launchDetailView(launch("confirmed", null));
    assert.equal(planned.showForm, true);
    assert.equal(confirmed.showForm, true);
    assert.equal(planned.causeText, undefined);
    const html = renderLaunchDetail(launch("planned", null), "Carrier", noSeats);
    assert.equal(html.includes('id="cancel-form"'), true);
    assert.equal(html.includes("Económico"), true);
    assert.equal(html.includes("Meteorológico"), true);
    assert.equal(html.includes("Técnico"), true);
  });

  void test("shows the cancellation record and hides the form when cancelled", () => {
    const view = launchDetailView(launch("cancelled", recorded));
    assert.equal(view.showForm, false);
    assert.equal(view.causeTypeLabel, "Técnico");
    assert.equal(view.causeText, "Valve leak");
    assert.equal(view.cancelledAt, recorded.cancelledAt);
    assert.equal(view.cancelledBy, "Ada Lovelace");
    const html = renderLaunchDetail(launch("cancelled", recorded), "Carrier", noSeats);
    assert.equal(html.includes('id="cancel-form"'), false);
    assert.equal(html.includes('id="launch-cancelled-by"'), true);
    assert.equal(html.includes("Ada Lovelace"), true);
  });

  void test("hides the form and the cause when the launch is successful", () => {
    const view = launchDetailView(launch("successful", null));
    assert.equal(view.showForm, false);
    assert.equal(view.causeTypeLabel, undefined);
    const html = renderLaunchDetail(launch("successful", null), "Carrier", noSeats);
    assert.equal(html.includes('id="cancel-form"'), false);
    assert.equal(html.includes('id="launch-cause-type"'), false);
  });

  void test("asks for name, email and phone on a planned launch with free seats", () => {
    assert.equal(showsBookingForm("planned", 9), true);
    const html = renderLaunchDetail(launch("planned", null), "Carrier", noSeats);
    assert.equal(html.includes('id="booking-form"'), true);
    assert.equal(html.includes('id="booking-name"'), true);
    assert.equal(html.includes('id="booking-email"'), true);
    assert.equal(html.includes('id="booking-phone"'), true);
    assert.equal(html.includes("9 of 9"), true);
    assert.equal(html.includes('id="launch-no-passengers"'), true);
  });

  void test("lists each passenger with name, email and phone and the free seats", () => {
    const html = renderLaunchDetail(launch("planned", null), "Carrier", seats(2));
    assert.equal(html.includes('id="launch-passengers"'), true);
    assert.equal(html.includes("P1"), true);
    assert.equal(html.includes("p2@example.com"), true);
    assert.equal(html.includes("+34 600 002"), true);
    assert.equal(html.includes("7 of 9"), true);
    assert.ok(html.indexOf("P1") < html.indexOf("P2"));
  });

  void test("hides the booking form and says no seats are left when full", () => {
    assert.equal(showsBookingForm("planned", 0), false);
    const html = renderLaunchDetail(launch("planned", null), "Carrier", seats(9));
    assert.equal(html.includes('id="booking-form"'), false);
    assert.equal(html.includes("No seats left"), true);
    assert.equal(html.includes("P9"), true);
  });

  void test("hides the booking form but lists passengers when not planned", () => {
    for (const status of ["confirmed", "successful", "cancelled"] as const) {
      assert.equal(showsBookingForm(status, 5), false);
      const html = renderLaunchDetail(launch(status, null), "Carrier", seats(4));
      assert.equal(html.includes('id="booking-form"'), false);
      assert.equal(html.includes("P4"), true);
    }
  });

  void test("shows a cancel booking button on each passenger of a planned launch", () => {
    assert.equal(showsCancelBooking("planned"), true);
    const html = renderLaunchDetail(launch("planned", null), "Carrier", seats(2));
    assert.equal(html.includes('data-cancel-booking="1"'), true);
    assert.equal(html.includes('data-cancel-booking="2"'), true);
    assert.equal(html.includes('id="booking-cancel-error"'), true);
  });

  void test("hides the cancel booking button when the launch is not planned", () => {
    for (const status of ["confirmed", "successful", "cancelled"] as const) {
      assert.equal(showsCancelBooking(status), false);
      const html = renderLaunchDetail(launch(status, null), "Carrier", seats(3));
      assert.equal(html.includes("data-cancel-booking"), false);
      assert.equal(html.includes("P3"), true);
    }
  });

  void test("shows the booking form again once a full launch frees a seat", () => {
    const full = renderLaunchDetail(launch("planned", null), "Carrier", seats(9));
    const freed = renderLaunchDetail(launch("planned", null), "Carrier", seats(8));
    assert.equal(full.includes('id="booking-form"'), false);
    assert.equal(freed.includes('id="booking-form"'), true);
    assert.equal(freed.includes("1 of 9"), true);
    assert.equal(freed.includes('data-cancel-booking="9"'), false);
  });

  void test("escapes passenger data", () => {
    const html = renderLaunchDetail(launch("planned", null), "Carrier", {
      ...seats(0),
      bookings: [{ ...passenger(1, "x"), name: "<script>" }],
    });
    assert.equal(html.includes("<script>"), false);
    assert.equal(html.includes("&lt;script&gt;"), true);
  });
});
