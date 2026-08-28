import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "./panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  align?: "left" | "right";
  sortValue?: (row: T) => number | string;
  cell: (row: T) => ReactNode;
  hideable?: boolean;
  defaultHidden?: boolean;
}

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  pageSize = 12,
  searchable = true,
  searchPlaceholder = "Filter rows…",
  searchFields,
  onRowClick,
  activeRowId,
  toolbar,
  dense = false,
  initialSort,
}: {
  rows: T[];
  columns: Column<T>[];
  pageSize?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFields?: (row: T) => string;
  onRowClick?: (row: T) => void;
  activeRowId?: string | null;
  toolbar?: ReactNode;
  dense?: boolean;
  initialSort?: { key: string; dir: "asc" | "desc" };
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(initialSort ?? null);
  const [hidden, setHidden] = useState<string[]>(
    columns.filter((c) => c.defaultHidden).map((c) => c.key),
  );

  const visibleColumns = columns.filter((c) => !hidden.includes(c.key));

  const filtered = useMemo(() => {
    if (!query.trim() || !searchFields) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) => searchFields(r).toLowerCase().includes(q));
  }, [rows, query, searchFields]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return filtered;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [filtered, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(current * pageSize, current * pageSize + pageSize);

  const toggleSort = (key: string) =>
    setSort((s) =>
      s?.key === key ? (s.dir === "desc" ? { key, dir: "asc" } : null) : { key, dir: "desc" },
    );

  return (
    <div className="flex min-w-0 flex-col">
      {(searchable || toolbar) && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2.5">
          {searchable && searchFields && (
            <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                placeholder={searchPlaceholder}
                className="h-8 border-border bg-background pl-8 text-xs"
              />
            </div>
          )}
          <div className="flex flex-1 items-center justify-end gap-2">
            {toolbar}
            {columns.some((c) => c.hideable) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                    <Columns3 className="size-3.5" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs">Visible columns</DropdownMenuLabel>
                  {columns
                    .filter((c) => c.hideable)
                    .map((c) => (
                      <DropdownMenuCheckboxItem
                        key={c.key}
                        checked={!hidden.includes(c.key)}
                        onCheckedChange={(v) =>
                          setHidden((h) => (v ? h.filter((k) => k !== c.key) : [...h, c.key]))
                        }
                        className="text-xs"
                      >
                        {c.header}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      )}

      {pageRows.length === 0 ? (
        <EmptyState
          title="No matching rows"
          description="No records satisfy the current filter combination. Clear a filter or broaden the search term."
        />
      ) : (
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                {visibleColumns.map((c) => (
                  <th
                    key={c.key}
                    style={c.width ? { width: c.width } : undefined}
                    className={cn(
                      "label-xs select-none whitespace-nowrap px-3 py-2 font-semibold",
                      c.align === "right" ? "text-right" : "text-left",
                      c.sortValue && "cursor-pointer hover:text-foreground",
                    )}
                    onClick={c.sortValue ? () => toggleSort(c.key) : undefined}
                  >
                    <span className={cn("inline-flex items-center gap-1", c.align === "right" && "flex-row-reverse")}>
                      {c.header}
                      {sort?.key === c.key &&
                        (sort.dir === "desc" ? (
                          <ArrowDown className="size-3 text-primary" />
                        ) : (
                          <ArrowUp className="size-3 text-primary" />
                        ))}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <tr
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "border-b border-border/70 transition-colors last:border-0",
                    onRowClick && "cursor-pointer hover:bg-surface-raised",
                    activeRowId === row.id && "bg-primary/8 hover:bg-primary/10",
                  )}
                >
                  {visibleColumns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        "px-3 align-middle text-[13px] text-foreground/90",
                        dense ? "py-1.5" : "py-2.5",
                        c.align === "right" && "text-right",
                      )}
                    >
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-3 py-2">
        <p className="num text-[11px] text-muted-foreground">
          {sorted.length === 0 ? 0 : current * pageSize + 1}–
          {Math.min(sorted.length, (current + 1) * pageSize)} of {sorted.length.toLocaleString("en-US")} rows
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <span className="num px-1 text-[11px] text-muted-foreground">
            {current + 1} / {pageCount}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            disabled={current >= pageCount - 1}
            onClick={() => setPage(current + 1)}
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
