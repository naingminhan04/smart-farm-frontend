import { cx } from "./utils";

export const panelClass = cx(
  "group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl",
  "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(800px_circle_at_20%_0%,rgba(56,189,248,0.14),transparent_60%)] before:opacity-0 before:transition-opacity before:duration-500 group-hover:before:opacity-100"
);

export const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-sky-400/30";

export const buttonPrimary = cx(buttonBase, "bg-sky-500/90 text-white hover:bg-sky-400");
export const buttonMuted = cx(buttonBase, "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10");
export const buttonDanger = cx(buttonBase, "bg-red-500/90 text-white hover:bg-red-400");

export const inputClass = cx(
  "min-w-[180px] flex-1 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-[10px] text-slate-100 placeholder:text-slate-500",
  "outline-none transition focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20"
);

export const badgeClass = cx(
  "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200"
);
