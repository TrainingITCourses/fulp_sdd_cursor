import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { Launch } from "../shared/repositories/launches.repository.js";
import { launchDetailView, renderLaunchDetail } from "./launch-detail.view.js";

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

void describe("launch detail view", () => {
  void test("asks for a cause on a planned or confirmed launch", () => {
    const planned = launchDetailView(launch("planned", null));
    const confirmed = launchDetailView(launch("confirmed", null));
    assert.equal(planned.showForm, true);
    assert.equal(confirmed.showForm, true);
    assert.equal(planned.causeText, undefined);
    const html = renderLaunchDetail(launch("planned", null), "Carrier");
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
    const html = renderLaunchDetail(launch("cancelled", recorded), "Carrier");
    assert.equal(html.includes('id="cancel-form"'), false);
    assert.equal(html.includes('id="launch-cancelled-by"'), true);
    assert.equal(html.includes("Ada Lovelace"), true);
  });

  void test("hides the form and the cause when the launch is successful", () => {
    const view = launchDetailView(launch("successful", null));
    assert.equal(view.showForm, false);
    assert.equal(view.causeTypeLabel, undefined);
    const html = renderLaunchDetail(launch("successful", null), "Carrier");
    assert.equal(html.includes('id="cancel-form"'), false);
    assert.equal(html.includes('id="launch-cause-type"'), false);
  });
});
