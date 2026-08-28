import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Panel({
  children,
  className,
  flush = false,
}: {
  children: ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-md border border-border bg-surface",
        flush ? "" : "",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex min-h-12 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-2.5",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="truncate text-[13px] font-semibold tracking-tight text-foreground">{title}</h2>
        {subtitle && <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

export function ChartContainer({
  title,
  subtitle,
  actions,
  children,
  className,
  bodyClassName,
  footer,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  footer?: ReactNode;
}) {
  return (
    <Panel className={cn("flex flex-col", className)}>
      <PanelHeader title={title} subtitle={subtitle} actions={actions} />
      <div className={cn("min-w-0 flex-1 p-4", bodyClassName)}>{children}</div>
      {footer && <div className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">{footer}</div>}
    </Panel>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  meta,
  badge,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
      <div className="min-w-0 max-w-2xl">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
          {badge}
        </div>
        {description && <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>}

        {meta && <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function MetaItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="label-xs">{label}</span>
      <span className="num text-xs text-foreground/90">{value}</span>
    </div>
  );
}

export function LoadingState({ label = "Loading data", rows = 3 }: { label?: string; rows?: number }) {
  return (
    <div className="flex flex-col gap-3 p-6" role="status" aria-live="polite">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        {label}…
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-7 animate-pulse rounded-sm bg-muted/70"
            style={{ animationDelay: `${i * 90}ms`, width: `${100 - i * 7}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function EmptyState({
  title = "No results",
  description = "Adjust the filters or widen the time range to see data here.",
  action,
  icon,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="mb-1 flex size-9 items-center justify-center rounded-md border border-border bg-secondary/50 text-muted-foreground">
        {icon ?? <Inbox className="size-4" />}
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">{description}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <div className="mb-1 flex size-9 items-center justify-center rounded-md border border-destructive/40 bg-destructive/10 text-destructive">
        <AlertTriangle className="size-4" />
      </div>
      <p className="text-sm font-medium text-foreground">Request failed</p>
      <p className="num max-w-md text-xs text-muted-foreground">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 h-8 rounded-sm border border-border bg-secondary px-3 text-xs font-medium transition-colors hover:bg-accent"
        >
          Retry request
        </button>
      )}
    </div>
  );
}

/** Standard async wrapper: loading / error / empty / data. */
export function AsyncBoundary<T>({
  query,
  children,
  loadingLabel,
  empty,
}: {
  query: UseQueryResult<T, Error>;
  children: (data: T) => ReactNode;
  loadingLabel?: string;
  empty?: ReactNode;
}) {
  if (query.isPending) return <LoadingState {...(loadingLabel ? { label: loadingLabel } : {})} />;
  if (query.isError) return <ErrorState error={query.error} onRetry={query.refetch} />;
  const data = query.data as T;
  if (Array.isArray(data) && data.length === 0) return <>{empty ?? <EmptyState />}</>;
  return <>{children(data)}</>;
}
