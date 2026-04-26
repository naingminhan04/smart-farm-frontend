import type { DoorState } from "../types";
import { badgeClass, buttonBase, panelClass } from "./ui";
import { cx } from "./utils";

type DoorControlCardProps = {
  busy: boolean;
  doorState: string;
  onDoorChange: (state: DoorState) => void;
};

export function DoorControlCard({ busy, doorState, onDoorChange }: DoorControlCardProps) {
  return (
    <article className={cx(panelClass, "animate-fade-up [animation-delay:140ms]")}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300">Door State</h2>
        <span
          className={cx(
            badgeClass,
            doorState === "ON"
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
              : "border-slate-400/20 bg-white/5 text-slate-200"
          )}
        >
          {doorState === "ON" ? "OPEN" : "CLOSED"}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => onDoorChange("ON")}
          disabled={busy}
          className={cx(
            buttonBase,
            "flex-1 border border-neutral-200 bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
            doorState === "ON" && "ring-2 ring-neutral-200/40"
          )}
        >
          Open
        </button>
        <button
          onClick={() => onDoorChange("OFF")}
          disabled={busy}
          className={cx(
            buttonBase,
            "flex-1 border border-neutral-700/80 bg-neutral-900 text-neutral-100 hover:bg-neutral-800",
            doorState === "OFF" && "ring-2 ring-neutral-500/35"
          )}
        >
          Close
        </button>
      </div>
    </article>
  );
}
