import type { ReactNode } from "react";
import { compact } from "@/lib/format";

export const AXIS = {
  stroke: "var(--border)",
  tick: { fill: "var(--muted-foreground)", fontSize: 10, fontFamily: "var(--font-mono)" },
  tickLine: false,
  axisLine: { stroke: "var(--border)" },
} as const;

export const GRID = {
  stroke: "var(--border)",
  strokeDasharray: "2 4",
  vertical: false,
} as const;

export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

export function TooltipCard({
  label,
  rows,
  footer,
}: {
  label?: ReactNode;
  rows: { name: string; value: ReactNode; color?: string }[];
  footer?: ReactNode;
}) {
  return (
    <div className="min-w-[150px] rounded-md border border-border bg-popover/97 px-2.5 py-2 shadow-xl backdrop-blur">
      {label && <p className="num mb-1.5 text-[11px] text-muted-foreground">{label}</p>}
      <div className="space-y-1">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center justify-between gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              {r.color && <span className="size-1.5 rounded-full" style={{ background: r.color }} />}
              {r.name}
            </span>
            <span className="num font-medium text-foreground">{r.value}</span>
          </div>
        ))}
      </div>
      {footer && <p className="mt-1.5 border-t border-border pt-1.5 text-[10px] text-muted-foreground">{footer}</p>}
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function chartTooltip(
  formatLabel?: (l: any) => string,
  formatValue?: (v: any, name: string) => string,
) {
  return function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
      <TooltipCard
        label={formatLabel ? formatLabel(label) : label}
        rows={payload.map((p: any) => ({
          name: String(p.name),
          value: formatValue ? formatValue(p.value, String(p.name)) : compact(Number(p.value)),
          color: p.color ?? p.stroke ?? p.fill,
        }))}
      />
    );
  };
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="size-2 rounded-[2px]" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}
