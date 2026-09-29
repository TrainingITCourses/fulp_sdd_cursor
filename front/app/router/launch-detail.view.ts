import { escapeHtml } from "../core/escape-html.js";
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

export const renderLaunchDetail = (launch: Readonly<Launch>, rocketLabel: string): string => {
  const view = launchDetailView(launch);
  return `${renderFacts(launch, rocketLabel, view)}${renderCancellation(view)}${renderCancelForm(view.showForm)}
    <p><a href="/launches">Back to launches</a></p>`;
};
