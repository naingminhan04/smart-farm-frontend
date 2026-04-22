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
            "flex-1 border border-emerald-400/20 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/15",
            doorState === "ON" && "ring-2 ring-emerald-400/25"
          )}
        >
          Open
        </button>
        <button
          onClick={() => onDoorChange("OFF")}
          disabled={busy}
          className={cx(
            buttonBase,
            "flex-1 border border-red-400/20 bg-red-400/10 text-red-100 hover:bg-red-400/15",
            doorState === "OFF" && "ring-2 ring-red-400/25"
          )}
        >
          Close
        </button>
      </div>
    </article>
  );
}
