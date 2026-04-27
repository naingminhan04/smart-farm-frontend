import type { IntruderAlertHistoryPanelProps } from "../types";
import { badgeClass, buttonMuted, panelClass } from "./ui";
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

export function IntruderAlertHistoryPanel({ alerts, admin, authChecking, onOpenAdminLogin }: IntruderAlertHistoryPanelProps) {
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
        <ul className="space-y-2">
          {alerts.length ? (
            alerts.map((alert) => (
              <li
                key={alert.id}
                className="flex flex-col gap-3 rounded-2xl border border-neutral-700/70 bg-neutral-800/70 px-4 py-3 text-sm text-slate-200 transition hover:bg-neutral-700/70 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-400">Alert</div>
                  <div className="mt-1 break-all text-sm font-semibold tracking-wide text-slate-100">{alert.message}</div>
                  <div className="mt-2 text-xs text-slate-400">Detected: {formatAlertTime(alert.detectedAt)}</div>
                  {alert.clearedAt ? <div className="mt-1 text-xs text-slate-400">Cleared: {formatAlertTime(alert.clearedAt)}</div> : null}
                  {alert.acknowledgedAt ? (
                    <div className="mt-1 text-xs text-slate-400">
                      Acknowledged: {formatAlertTime(alert.acknowledgedAt)}
                      {alert.acknowledgedBy?.username ? ` by ${alert.acknowledgedBy.username}` : ""}
                    </div>
                  ) : null}
                  {alert.emergencyDialedAt ? (
                    <div className="mt-1 text-xs text-slate-400">Emergency: {formatAlertTime(alert.emergencyDialedAt)}</div>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
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
  );
}
