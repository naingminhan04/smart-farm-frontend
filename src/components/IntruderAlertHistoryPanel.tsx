import type { IntruderAlertHistoryPanelProps } from "../types";
import { badgeClass, panelClass } from "./ui";
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

export function IntruderAlertHistoryPanel({ alerts, admin, authChecking }: IntruderAlertHistoryPanelProps) {
  return (
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
        <>

          <div className="mt-5">
            <ul className="space-y-2">
              <li className="rounded-2xl border border-neutral-700/70 bg-neutral-800/70 px-4 py-3 text-sm text-slate-300">
                You need to be logined to view the intruder history and real-time intruder alert.
              </li>
            </ul>
          </div>
        </>
      ) : (
      <div className="mt-5">
        <ul className="scrollbar-none max-h-[22rem] space-y-2 overflow-y-auto pr-1">
          {alerts.length ? (
            alerts.map((alert) => {
              const acknowledgedByLabel = getAcknowledgedByLabel(alert, admin);
              const emergencyDialedByLabel = getEmergencyDialedByLabel(alert, admin);
              const actionSummary = alert.emergencyDialedAt
                ? {
                    label: `Emergency dialed${emergencyDialedByLabel ? ` by ${emergencyDialedByLabel}` : ""}`,
                    time: formatAlertTime(alert.emergencyDialedAt)
                  }
                : alert.acknowledgedAt
                  ? {
                      label: `Acknowledged${acknowledgedByLabel ? ` by ${acknowledgedByLabel}` : ""}`,
                      time: formatAlertTime(alert.acknowledgedAt)
                    }
                  : alert.clearedAt
                    ? {
                        label: "Cleared",
                        time: formatAlertTime(alert.clearedAt)
                      }
                    : null;

              return (
                <li
                  key={alert.id}
                  className="flex flex-col gap-3 rounded-2xl border border-neutral-700/70 bg-neutral-800/70 px-4 py-3 text-sm text-slate-200 transition hover:bg-neutral-700/70 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-400">Alert</div>
                    <div className="mt-1 break-all text-sm font-semibold tracking-wide text-slate-100">{alert.message}</div>
                    <div className="mt-2 text-xs text-slate-400">Detected: {formatAlertTime(alert.detectedAt)}</div>
                    {alert.clearedAt && !actionSummary ? (
                      <div className="mt-1 text-xs text-slate-400">Cleared: {formatAlertTime(alert.clearedAt)}</div>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 sm:min-w-[220px] sm:items-end sm:text-right">
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
                    {actionSummary ? (
                      <div className="rounded-xl border border-neutral-700/70 bg-neutral-900/50 px-3 py-2">
                        <div className="text-xs font-semibold text-slate-300">{actionSummary.label}</div>
                        <div className="mt-1 text-xs text-slate-400">{actionSummary.time}</div>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })
          ) : (
            <li className="rounded-2xl border border-neutral-700/70 bg-neutral-800/70 px-4 py-3 text-sm text-slate-300">
              No intruder alerts yet.
            </li>
          )}
        </ul>
      </div>
      )}
    </section>
  );
}
