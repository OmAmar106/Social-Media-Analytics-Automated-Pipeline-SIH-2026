import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

/**
 * Right-hand drill-down surface used across the product
 * (creator profile, content detail, node inspection).
 */
export function DetailDrawer({
  open,
  onOpenChange,
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  width = "sm:max-w-[520px]",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn("flex w-full flex-col gap-0 border-l border-border bg-surface p-0", width)}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            {eyebrow && <p className="label-xs mb-1">{eyebrow}</p>}
            <SheetTitle className="truncate text-base font-semibold tracking-tight">{title}</SheetTitle>
            {subtitle && <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Close panel"
          >
            <X className="size-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-border px-5 py-3">{footer}</div>}
      </SheetContent>
    </Sheet>
  );
}

export function StatGrid({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border">
      {items.map((it) => (
        <div key={it.label} className="bg-surface px-3 py-2.5">
          <dt className="label-xs">{it.label}</dt>
          <dd className="num mt-1 text-sm font-medium text-foreground">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function DrawerSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-5 first:mt-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="label-xs">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}
