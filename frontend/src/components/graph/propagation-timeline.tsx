import { cn } from "@/lib/utils";
import { clockUTC } from "@/lib/format";
import type { PropagationGraph } from "@/lib/types";

const KIND_STYLE: Record<string, string> = {
  origin: "border-primary bg-primary",
  spread: "border-border-strong bg-surface",
  "cross-platform": "border-warning bg-warning/70",
  milestone: "border-positive bg-positive/70",
};

export function PropagationTimeline({
  events,
  activeNodeId,
  onSelect,
  className,
}: {
  events: PropagationGraph["timeline"];
  activeNodeId?: string | null;
  onSelect?: (nodeId: string | null) => void;
  className?: string;
}) {
  return (
    <ol className={cn("relative space-y-0", className)}>
      <span aria-hidden className="absolute bottom-3 left-[52px] top-3 w-px bg-border" />
      {events.map((ev) => {
        const isActive = !!ev.nodeId && ev.nodeId === activeNodeId;
        return (
          <li key={ev.id}>
            <button
              type="button"
              disabled={!ev.nodeId}
              onClick={() => onSelect?.(ev.nodeId ?? null)}
              className={cn(
                "group flex w-full items-start gap-3 rounded-sm px-2 py-2.5 text-left transition-colors",
                ev.nodeId ? "hover:bg-surface-raised" : "cursor-default",
                isActive && "bg-primary/10",
              )}
            >
              <span className="num w-9 shrink-0 pt-0.5 text-right text-[11px] tabular-nums text-muted-foreground">
                {clockUTC(ev.time)}
              </span>
              <span className="relative flex w-4 shrink-0 justify-center pt-1.5">
                <span
                  className={cn(
                    "size-2 rounded-full border transition-transform",
                    KIND_STYLE[ev.kind],
                    isActive && "scale-150",
                  )}
                />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block truncate text-[13px] font-medium",
                    isActive ? "text-primary" : "text-foreground/90",
                  )}
                >
                  {ev.label}
                </span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
                  {ev.detail}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
