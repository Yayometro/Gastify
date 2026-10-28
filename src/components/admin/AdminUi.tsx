import React from "react";

// The building blocks of the admin panel. They use the same glass cards, insets and purples as the wallet (see globals.css), so
// the panel reads as Gastify and not as a generic back office.

export function Card({ title, hint, children, className = "" }: { title: string; hint?: string; children: React.ReactNode; className?: string }): React.JSX.Element {
  return (
    <section className={`gf-glass-card rounded-[32px] p-5 ${className}`}>
      <header className="mb-4">
        <h2 className="text-base font-extrabold text-gf-text">{title}</h2>
        {hint && <p className="mt-1 text-xs text-gf-text-muted">{hint}</p>}
      </header>
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: React.ReactNode }): React.JSX.Element {
  return (
    <div className="gf-glass-card rounded-[28px] p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-purple-300">{label}</p>
      <p className="mt-2 text-3xl font-extrabold tabular-nums text-gf-text">{value}</p>
      {hint && <p className="mt-2 text-xs text-gf-text-muted">{hint}</p>}
    </div>
  );
}

export function Tabs({ items }: { items: { href: string; label: string; active: boolean }[] }): React.JSX.Element {
  return (
    <nav aria-label="Secciones del panel" className="gf-glass-inset flex w-fit max-w-full flex-wrap gap-1 rounded-full p-1.5">
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${item.active ? "gf-glass-button text-white" : "text-purple-200/80 hover:bg-white/10 hover:text-white"}`}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}

export function RangeLinks({ base, current, options }: { base: string; current: number; options: readonly number[] }): React.JSX.Element {
  return (
    <div className="gf-glass-inset flex gap-1 rounded-full p-1.5" role="group" aria-label="Periodo">
      {options.map((days) => (
        <a
          key={days}
          href={`${base}?range=${days}`}
          aria-current={current === days ? "true" : undefined}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${current === days ? "gf-glass-button text-white" : "text-purple-200/80 hover:bg-white/10 hover:text-white"}`}
        >
          {days} días
        </a>
      ))}
    </div>
  );
}

// A list of labelled bars. Each bar is a share of the biggest one in the list.
export function BarList({ rows, empty = "Sin datos todavía." }: { rows: { label: string; count: number; note?: string }[]; empty?: string }): React.JSX.Element {
  if (rows.length === 0) return <p className="text-sm text-gf-text-muted">{empty}</p>;
  const max = rows.reduce((top, row) => Math.max(top, row.count), 0) || 1;
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => (
        <li key={row.label} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-gf-text">{row.label}</span>
            <span className="shrink-0 tabular-nums text-gf-text-muted">
              {new Intl.NumberFormat("es-MX").format(row.count)}
              {row.note ? ` · ${row.note}` : ""}
            </span>
          </div>
          <span className="h-2 overflow-hidden rounded-full bg-white/10">
            <span className="block h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500" style={{ width: `${(row.count / max) * 100}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

// One column per day (or per week). The title of each column says the label and the count, for people who need the numbers.
export function Columns({ series, label, height = "h-36" }: { series: { label: string; count: number }[]; label: string; height?: string }): React.JSX.Element {
  const max = series.reduce((top, entry) => Math.max(top, entry.count), 0) || 1;
  return (
    <figure>
      <div role="img" aria-label={label} className={`flex ${height} items-end gap-1`}>
        {series.map((entry) => (
          <div key={entry.label} title={`${entry.label}: ${entry.count}`} className="flex h-full flex-1 items-end">
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-purple-600 to-fuchsia-400"
              style={{ height: `${entry.count > 0 ? Math.max(6, (entry.count / max) * 100) : 2}%`, opacity: entry.count > 0 ? 1 : 0.25 }}
            />
          </div>
        ))}
      </div>
      <figcaption className="mt-2 flex justify-between text-xs text-gf-text-muted">
        <span>{series[0]?.label ?? ""}</span>
        <span>{series[series.length - 1]?.label ?? ""}</span>
      </figcaption>
    </figure>
  );
}

export function Empty({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <p className="rounded-2xl border border-gf-border bg-white/5 p-4 text-sm text-gf-text-muted">{children}</p>;
}

// Formats a share (0 to 1) as a whole percentage, or a dash when there is nothing to divide.
export function percentText(rate: number | null): string {
  return rate === null ? "—" : `${Math.round(rate * 100)}%`;
}

export function dateText(iso: string | null): string {
  return iso ? new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(new Date(iso)) : "—";
}

export function dateTimeText(iso: string | null): string {
  return iso ? new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso)) : "—";
}

export const count = (value: number): string => new Intl.NumberFormat("es-MX").format(Math.round(value));
