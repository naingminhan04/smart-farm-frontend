import type { IntruderAlertModalProps } from "../types";
import { buttonDanger, buttonMuted } from "./ui";

function formatAlertTime(value: string) {
  return new Date(value).toLocaleString();
}

export function IntruderAlertModal({
  alert,
  canPlaySound,
  busy = false,
  onEnableSound,
  onAcknowledge,
  onDialEmergency
}: IntruderAlertModalProps) {
  if (!alert) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[28px] border border-red-300/20 bg-neutral-950/95 p-6 text-neutral-100 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <div className="inline-flex rounded-full border border-red-300/30 bg-red-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-red-50">
          Intruder Alert
        </div>

        <h2 className="mt-4 text-2xl font-semibold text-red-50">Laser fence interruption detected</h2>
        <p className="mt-3 text-sm leading-6 text-slate-200">{alert.message}</p>
        <p className="mt-3 text-xs text-slate-400">Detected at {formatAlertTime(alert.detectedAt)}</p>

        {!canPlaySound ? (
          <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-50">
            <p>
              Browser audio is locked until the first interaction. On iPhone Safari, tap the button below once to enable
              the alarm sound while this alert is open.
            </p>
            <button onClick={onEnableSound} disabled={busy} className={`${buttonMuted} mt-3`}>
              Enable Alarm Sound
            </button>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button onClick={onAcknowledge} disabled={busy} className={buttonMuted}>
            Acknowledge
          </button>
          <button onClick={onDialEmergency} disabled={busy} className={buttonDanger}>
            Dial Emergency
          </button>
        </div>
      </div>
    </div>
  );
}
