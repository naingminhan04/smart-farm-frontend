import { cx } from "./utils";

export const panelClass = cx(
  "group relative overflow-hidden max-h-[90vh] overflow-y-hidden rounded-2xl border border-neutral-700/70 bg-neutral-900/70 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur-xl",
  "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(700px_circle_at_20%_0%,rgba(147,197,253,0.10),transparent_60%)] before:opacity-0 before:transition-opacity before:duration-500 group-hover:before:opacity-100"
);

export const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-300/30";

export const buttonPrimary = cx(buttonBase, "border border-neutral-300 bg-neutral-100 text-neutral-900 hover:bg-neutral-200");
export const buttonMuted = cx(buttonBase, "border border-neutral-700/70 bg-neutral-800/70 text-neutral-100 hover:bg-neutral-700/70");
export const buttonDanger = cx(buttonBase, "border border-red-300/30 bg-red-500/20 text-red-100 hover:bg-red-500/30");

export const inputClass = cx(
  "min-w-[180px] flex-1 rounded-xl border border-neutral-700/70 bg-neutral-900/70 px-3 py-[10px] text-neutral-100 placeholder:text-neutral-500",
  "outline-none transition focus:border-blue-300/60 focus:ring-2 focus:ring-blue-300/20"
);

export const badgeClass = cx(
  "inline-flex items-center gap-2 rounded-full border border-neutral-700/70 bg-neutral-800/70 px-3 py-1 text-xs font-semibold text-neutral-100"
);
