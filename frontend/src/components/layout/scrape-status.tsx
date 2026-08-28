import { Activity, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppState } from "@/lib/app-state";
import { durationLabel, full } from "@/lib/format";
import { PLATFORM_META } from "@/lib/mock/dataset";
import { scrapeState } from "@/lib/mock/dataset";
import { Button } from "@/components/ui/button";

export function ScrapeButton({
  size = "default",
  className,
}: {
  size?: "default" | "sm";
  className?: string;
}) {
  const { scraping, runScrape, progress } = useAppState();
  return (
    <Button
      onClick={runScrape}
      disabled={scraping}
      size={size === "sm" ? "sm" : "default"}
      className={cn(
        "relative overflow-hidden font-medium",
        size === "sm" ? "h-8 text-xs" : "h-9 text-[13px]",
        className,
      )}
    >
      {scraping && (
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 bg-primary-foreground/20 transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      )}
      <span className="relative flex items-center gap-1.5">
        {scraping ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
        {scraping ? `Scraping… ${progress}%` : "Scrape Now"}
      </span>
    </Button>
  );
}

export function ScrapeStatus({ collapsed = false }: { collapsed?: boolean }) {
  const { scraping, progress, stage, lastScrapeMinutes, nextScrapeMinutes, lastResult } = useAppState();

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 border-t border-border px-2 py-3">
        <span
          className={cn(
            "size-2 rounded-full",
            scraping ? "animate-pulse bg-warning" : "bg-positive",
          )}
          title={scraping ? "Scrape running" : "System operational"}
        />
        <ScrapeButton size="sm" className="w-full px-0" />
      </div>
    );
  }

  return (
    <div className="border-t border-border px-3 py-3">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="label-xs">System status</span>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-positive">
          <span className={cn("size-1.5 rounded-full bg-positive", scraping && "animate-pulse bg-warning")} />
          {scraping ? "Collecting" : "Operational"}
        </span>
      </div>

      <dl className="space-y-1 text-[11px]">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Last scrape</dt>
          <dd className="num text-foreground/90">
            {lastScrapeMinutes === 0 ? "just now" : `${lastScrapeMinutes} min ago`}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Next scheduled</dt>
          <dd className="num text-foreground/90">in {durationLabel(nextScrapeMinutes)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Collectors</dt>
          <dd className="num text-foreground/90">
            {scrapeState.collectors.filter((c) => c.healthy).length}/{scrapeState.collectors.length} healthy
          </dd>
        </div>
      </dl>

      <div className="mt-2.5 flex flex-wrap gap-1">
        {scrapeState.collectors.map((c) => (
          <span
            key={c.platform}
            title={`${PLATFORM_META[c.platform].name} · last batch ${full(c.lastBatch)} docs`}
            className="inline-flex h-5 items-center gap-1 rounded-sm border border-border bg-secondary/50 px-1.5 text-[10px]"
          >
            <span className="size-1 rounded-full bg-positive" />
            <span className="num">{PLATFORM_META[c.platform].short}</span>
          </span>
        ))}
      </div>

      {scraping && (
        <div className="mt-3">
          <div className="h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1.5 truncate text-[10px] text-muted-foreground">{stage}</p>
        </div>
      )}

      {!scraping && lastResult && (
        <p className="num mt-2.5 flex items-center gap-1.5 text-[10px] text-positive">
          <Activity className="size-3" />
          {full(lastResult.newPosts)} new posts · {lastResult.newTrends} trends
        </p>
      )}

      <ScrapeButton size="sm" className="mt-3 w-full" />
    </div>
  );
}
