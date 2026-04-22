import { badgeClass, panelClass } from "./ui";
import { cx } from "./utils";

type MetricCardProps = {
  title: string;
  value: string;
  unit: string;
  animationDelayClass?: string;
};

export function MetricCard({ title, value, unit, animationDelayClass }: MetricCardProps) {
  return (
    <article className={cx(panelClass, "animate-fade-up", animationDelayClass)}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300">{title}</h2>
        <span className={badgeClass}>Sensor</span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-4xl font-semibold tracking-tight">{value}</span>
        <span className="text-sm font-semibold text-slate-400">{unit}</span>
      </div>
    </article>
  );
}
