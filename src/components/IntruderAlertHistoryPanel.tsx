import { useState } from "react";
import type { IntruderAlertHistoryPanelProps } from "../types";
import { badgeClass, buttonDanger, buttonMuted, panelClass } from "./ui";
import { cx } from "./utils";

function formatAlertTime(value: string) {
  return new Date(value).toLocaleString();
}

function getAlertStatus(alert: IntruderAlertHistoryPanelProps["alerts"][number]) {
  if (alert.emergencyDialedAt) return "Emergency dialed";
  if (alert.acknowledgedAt) return "Acknowledged";
  if (alert.clearedAt) return "Cleared";
  return "Active";
}

function getAcknowledgedByLabel(
  alert: IntruderAlertHistoryPanelProps["alerts"][number],
  admin: IntruderAlertHistoryPanelProps["admin"]
) {
  if (alert.acknowledgedBy?.username) return alert.acknowledgedBy.username;
  if (alert.acknowledgedByUsername) return alert.acknowledgedByUsername;
  if (admin && alert.acknowledgedById === admin.id) return admin.username;
  if (alert.acknowledgedById) return `Admin #${alert.acknowledgedById}`;
  return null;
}

function getEmergencyDialedByLabel(
  alert: IntruderAlertHistoryPanelProps["alerts"][number],
  admin: IntruderAlertHistoryPanelProps["admin"]
) {
  if (alert.emergencyDialedBy?.username) return alert.emergencyDialedBy.username;
  if (alert.emergencyDialedByUsername) return alert.emergencyDialedByUsername;
  if (admin && alert.emergencyDialedById === admin.id) return admin.username;
  if (alert.emergencyDialedById) return `Admin #${alert.emergencyDialedById}`;
  return null;
}

function IntruderAlertHistoryDetailModal({
  alert,
  admin,
  busy,
  onAcknowledge,
  onDialEmergency,
  onClose
}: {
  alert: IntruderAlertHistoryPanelProps["alerts"][number] | null;
  admin: IntruderAlertHistoryPanelProps["admin"];
  busy: boolean;
  onAcknowledge: (id: number) => void | Promise<void>;
  onDialEmergency: (id: number) => void | Promise<void>;
  onClose: () => void;
}) {
  if (!alert) return null;

  const acknowledgedByLabel = getAcknowledgedByLabel(alert, admin);
  const emergencyDialedByLabel = getEmergencyDialedByLabel(alert, admin);
  const canTakeAction = alert.requiresAction && !alert.acknowledgedAt && !alert.emergencyDialedAt;
  const details = [
    { label: "Message", value: alert.message },
    { label: "Status", value: getAlertStatus(alert) },
    { label: "Detected At", value: formatAlertTime(alert.detectedAt) },
    alert.clearedAt ? { label: "Cleared At", value: formatAlertTime(alert.clearedAt) } : null,
    alert.acknowledgedAt ? { label: "Acknowledged At", value: formatAlertTime(alert.acknowledgedAt) } : null,
    acknowledgedByLabel ? { label: "Acknowledged By", value: acknowledgedByLabel } : null,
    alert.emergencyDialedAt ? { label: "Emergency Dialed At", value: formatAlertTime(alert.emergencyDialedAt) } : null,
    emergencyDialedByLabel ? { label: "Emergency Dialed By", value: emergencyDialedByLabel } : null,
    { label: "Requires Action", value: alert.requiresAction ? "Yes" : "No" }
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-black/75" aria-label="Close alert details" onClick={onClose} />
      <div className={cx(panelClass, "before:hidden relative z-10 flex max-h-[min(90vh,40rem)] w-full max-w-xl flex-col")}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-100">Intruder Alert Details</h3>
            <p className="mt-1 text-xs text-slate-400">Review the full alert timeline and admin actions.</p>
          </div>
          <button className={buttonMuted} onClick={onClose}>
            Close
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span
            className={cx(
              badgeClass,
              alert.emergencyDialedAt
                ? "border-red-300/40 bg-red-500/20 text-red-50"
                : alert.acknowledgedAt
                  ? "border-emerald-300/30 bg-emerald-500/15 text-emerald-50"
                  : "border-amber-300/30 bg-amber-500/15 text-amber-50"
            )}
          >
            {getAlertStatus(alert)}
          </span>
        </div>

        <div className="scrollbar-none mt-4 min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-3">
            {details.map((detail) => (
              <div key={detail.label} className="rounded-2xl border border-neutral-700/70 bg-neutral-800/70 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{detail.label}</div>
                <div className="mt-2 break-words text-sm font-semibold text-slate-100">{detail.value}</div>
              </div>
            ))}
          </div>
        </div>

        {canTakeAction ? (
          <div className="mt-5 flex flex-col gap-2 border-t border-neutral-700/70 pt-5 sm:flex-row sm:justify-end">
            <button
              className={buttonMuted}
              onClick={async () => {
                await onAcknowledge(alert.id);
                onClose();
              }}
              disabled={busy}
            >
              {busy ? "Submitting..." : "Acknowledge"}
            </button>
            <button
              className={buttonDanger}
              onClick={async () => {
                await onDialEmergency(alert.id);
                onClose();
              }}
              disabled={busy}
            >
              {busy ? "Submitting..." : "Dial Emergency"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function IntruderAlertHistoryPanel({
  alerts,
  admin,
  authChecking,
  intruderActionSubmitting,
  onAcknowledgeIntruderAlert,
  onDialEmergencyIntruderAlert
}: IntruderAlertHistoryPanelProps) {
  const [selectedAlert, setSelectedAlert] = useState<IntruderAlertHistoryPanelProps["alerts"][number] | null>(null);

  return (
    <>
      <section className={cx(panelClass, "mt-6 animate-fade-up [animation-delay:120ms]")}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Intruder Alert History</h2>
            <p className="mt-1 text-xs text-slate-400">Latest 20 laser-fence alerts reported by the controller.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <span className={badgeClass}>{alerts.length} records</span>
            {authChecking ? <span className={badgeClass}>Checking admin...</span> : null}
            {admin ? (
              <span className={cx(badgeClass, "border-emerald-400/30 bg-emerald-400/10 text-emerald-100")}>
                Admin: {admin.username}
              </span>
            ) : (
              <span className={cx(badgeClass, "border-amber-300/30 bg-amber-300/10 text-amber-50")}>
                Admin locked
              </span>
            )}
          </div>
        </div>

        {!admin ? (
          <div className="mt-5">
            <ul className="space-y-2">
              <li className="rounded-2xl border border-neutral-700/70 bg-neutral-800/70 px-4 py-3 text-sm text-slate-300">
                You need to be logined to view the intruder history and real-time intruder alert.
              </li>
            </ul>
          </div>
        ) : (
          <div className="mt-5">
            <ul className="scrollbar-none max-h-[22rem] space-y-2 overflow-y-auto pr-1">
              {alerts.length ? (
                alerts.map((alert) => (
                  <li key={alert.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedAlert(alert)}
                      className="flex w-full flex-col gap-3 rounded-2xl border border-neutral-700/70 bg-neutral-800/70 px-4 py-3 text-left text-sm text-slate-200 transition hover:bg-neutral-700/70 focus:outline-none focus:ring-2 focus:ring-blue-300/30 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-slate-400">Alert</div>
                        <div className="mt-1 break-all text-sm font-semibold tracking-wide text-slate-100">{alert.message}</div>
                        <div className="mt-2 text-xs text-slate-400">Detected: {formatAlertTime(alert.detectedAt)}</div>
                        <div className="mt-1 text-xs text-slate-500">Click to view full details</div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <span
                          className={cx(
                            badgeClass,
                            alert.emergencyDialedAt
                              ? "border-red-300/40 bg-red-500/20 text-red-50"
                              : alert.acknowledgedAt
                                ? "border-emerald-300/30 bg-emerald-500/15 text-emerald-50"
                                : "border-amber-300/30 bg-amber-500/15 text-amber-50"
                          )}
                        >
                          {getAlertStatus(alert)}
                        </span>
                      </div>
                    </button>
                  </li>
                ))
              ) : (
                <li className="rounded-2xl border border-neutral-700/70 bg-neutral-800/70 px-4 py-3 text-sm text-slate-300">
                  No intruder alerts yet.
                </li>
              )}
            </ul>
          </div>
        )}
      </section>

      <IntruderAlertHistoryDetailModal
        alert={selectedAlert}
        admin={admin}
        busy={intruderActionSubmitting}
        onAcknowledge={onAcknowledgeIntruderAlert}
        onDialEmergency={onDialEmergencyIntruderAlert}
        onClose={() => setSelectedAlert(null)}
      />
    </>
  );
}
