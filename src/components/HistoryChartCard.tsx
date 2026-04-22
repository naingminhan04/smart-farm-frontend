import type { ChartData, ChartOptions } from "chart.js";
import { Line } from "react-chartjs-2";
import { panelClass } from "./ui";
import { cx } from "./utils";

type HistoryChartCardProps = {
  title: string;
  totalPoints: number;
  showingFull: boolean;
  recentData: ChartData<"line">;
  fullData: ChartData<"line">;
  options: ChartOptions<"line">;
  animationDelayClass?: string;
  onShowRecent: () => void;
  onShowFull: () => void;
};

export function HistoryChartCard({
  title,
  totalPoints,
  showingFull,
  recentData,
  fullData,
  options,
  animationDelayClass,
  onShowRecent,
  onShowFull
}: HistoryChartCardProps) {
  return (
    <article className={cx(panelClass, "animate-fade-up", animationDelayClass)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
          <p className="mt-1 text-xs text-slate-400">
            {showingFull ? "Full history" : "Recent view"} ({showingFull ? totalPoints : Math.min(15, totalPoints)} points)
          </p>
        </div>
        <div className="flex w-full items-center rounded-full border border-white/10 bg-white/5 p-1 sm:w-auto">
          <button
            onClick={onShowRecent}
            className={cx(
              "flex-1 rounded-full px-3 py-1 text-xs font-semibold transition sm:flex-none",
              showingFull ? "text-slate-300 hover:text-slate-100" : "bg-white/10 text-slate-100"
            )}
          >
            Recent
          </button>
          <button
            onClick={onShowFull}
            className={cx(
              "flex-1 rounded-full px-3 py-1 text-xs font-semibold transition sm:flex-none",
              showingFull ? "bg-white/10 text-slate-100" : "text-slate-300 hover:text-slate-100"
            )}
          >
            Full
          </button>
        </div>
      </div>
      <div className="mt-4 max-w-full">
        <Line data={showingFull ? fullData : recentData} options={options} />
      </div>
    </article>
  );
}
