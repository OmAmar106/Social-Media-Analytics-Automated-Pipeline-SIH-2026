import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLATFORM_META } from "@/lib/mock/dataset";
import type { PlatformId, Sentiment, TrendStatus } from "@/lib/types";

export function PlatformBadge({
  platform,
  size = "sm",
  showName = false,
  className,
}: {
  platform: PlatformId;
  size?: "xs" | "sm";
  showName?: boolean;
  className?: string;
}) {
  const meta = PLATFORM_META[platform];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border border-border bg-secondary/60 font-medium text-foreground/85",
        size === "xs" ? "h-5 px-1.5 text-[10px]" : "h-6 px-2 text-xs",
        className,
      )}
      title={meta.name}
    >
      <span
        aria-hidden
        className="size-1.5 rounded-full"
        style={{ backgroundColor: meta.color }}
      />
      <span className="num tracking-tight">{showName ? meta.name : meta.short}</span>
    </span>
  );
}

export function PlatformStack({ platforms, max = 4 }: { platforms: PlatformId[]; max?: number }) {
  const shown = platforms.slice(0, max);
  return (
    <div className="flex items-center gap-1">
      {shown.map((p) => (
        <PlatformBadge key={p} platform={p} size="xs" />
      ))}
      {platforms.length > max && (
        <span className="num text-[10px] text-muted-foreground">+{platforms.length - max}</span>
      )}
    </div>
  );
}

const sentimentTone = (score: number) =>
  score > 0.15 ? "positive" : score < -0.15 ? "negative" : "neutral";

export function SentimentBadge({
  value,
  label,
  className,
}: {
  value: number | Sentiment;
  label?: string;
  className?: string;
}) {
  const tone = typeof value === "number" ? sentimentTone(value) : value;
  const text = label ?? (typeof value === "number" ? value.toFixed(2) : value);
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-sm border px-2 text-xs font-medium capitalize",
        tone === "positive" && "border-positive/35 bg-positive/10 text-positive",
        tone === "negative" && "border-negative/35 bg-negative/10 text-negative",
        tone === "neutral" && "border-border bg-secondary/60 text-muted-foreground",
        className,
      )}
    >
      <span className="num tabular-nums">{text}</span>
    </span>
  );
}

const STATUS_STYLE: Record<TrendStatus, string> = {
  surging: "border-negative/40 bg-negative/10 text-negative",
  rising: "border-positive/35 bg-positive/10 text-positive",
  steady: "border-border bg-secondary/70 text-muted-foreground",
  cooling: "border-warning/30 bg-warning/10 text-warning",
  declining: "border-border bg-secondary/50 text-muted-foreground",
};

export function TrendStatusBadge({ status }: { status: TrendStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1.5 rounded-sm border px-1.5 text-[10px] font-semibold uppercase tracking-wider",
        STATUS_STYLE[status],
      )}
    >
      {status}
    </span>
  );
}

export function Delta({
  value,
  suffix = "%",
  invert = false,
  className,
}: {
  value: number;
  suffix?: string;
  invert?: boolean;
  className?: string;
}) {
  const positive = invert ? value < 0 : value > 0;
  const flat = Math.abs(value) < 0.05;
  const Icon = flat ? ArrowRight : value > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "num inline-flex items-center gap-0.5 text-xs font-medium",
        flat ? "text-muted-foreground" : positive ? "text-positive" : "text-negative",
        className,
      )}
    >
      <Icon className="size-3.5" strokeWidth={2.2} />
      {value > 0 ? "+" : ""}
      {value.toFixed(1)}
      {suffix}
    </span>
  );
}

export function PredictedTag({ label = "Model estimate" }: { label?: string }) {
  return (
    <span className="inline-flex h-5 items-center rounded-sm border border-primary/30 bg-primary/10 px-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
      {label}
    </span>
  );
}
