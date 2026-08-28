import { cn } from "@/lib/utils";
import { compact } from "@/lib/format";
import { Delta } from "./badges";
import { Sparkline } from "./sparkline";

export interface KpiDatum {
  id: string;
  label: string;
  value: number;
  delta: number;
  unit?: string;
  hint?: string;
  spark: number[];
}

export function KpiCard({
  kpi,
  invertDelta = false,
  className,
}: {
  kpi: KpiDatum;
  invertDelta?: boolean;
  className?: string;
}) {
  const display =
    Math.abs(kpi.value) < 10 && !Number.isInteger(kpi.value)
      ? kpi.value.toFixed(2)
      : compact(kpi.value);
  const tone = invertDelta ? kpi.delta < 0 : kpi.delta > 0;

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between gap-3 border-b border-r border-border bg-surface p-4 transition-colors hover:bg-surface-raised",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="label-xs leading-tight">{kpi.label}</span>
        <Delta value={kpi.delta} invert={invertDelta} />
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="num text-2xl font-semibold leading-none tracking-tight text-foreground">
            {display}
            {kpi.unit && <span className="ml-0.5 text-sm text-muted-foreground">{kpi.unit}</span>}
          </div>
          {kpi.hint && <p className="mt-1.5 truncate text-[11px] text-muted-foreground">{kpi.hint}</p>}
        </div>
        <Sparkline
          data={kpi.spark}
          stroke={tone ? "var(--positive)" : kpi.delta === 0 ? "var(--muted-foreground)" : "var(--negative)"}
          className="shrink-0 opacity-80 transition-opacity group-hover:opacity-100"
        />
      </div>
    </div>
  );
}

export function KpiGrid({ kpis, className }: { kpis: KpiDatum[]; className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 overflow-hidden rounded-md border-l border-t border-border sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {kpis.map((k) => (
        <KpiCard key={k.id} kpi={k} invertDelta={k.id === "sentiment"} />
      ))}
    </div>
  );
}
