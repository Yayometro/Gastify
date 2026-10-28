import React from "react";
import InfoButton from "./InfoButton";

// The building blocks of the admin panel. They use the same glass cards, insets and purples as the wallet (see globals.css), so
// the panel reads as Gastify. Every number can be explained: hover shows a short hint, a click opens its full explanation.

const nf = new Intl.NumberFormat("es-MX");
export const count = (value: number): string => nf.format(Math.round(value));

// A "?" next to a title, that opens the explanation of the card.
function Explain({ title, text }: { title: string; text: string }): React.JSX.Element {
  return (
    <InfoButton title={title} hint="¿Qué significa?" body={<p>{text}</p>} className="inline-flex">
      <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/20 text-[11px] font-bold text-purple-200">
        ?
      </span>
    </InfoButton>
  );
}

export function Card({
  title,
  hint,
  explain,
  children,
  className = "",
}: {
  title: string;
  hint?: string;
  explain?: string;
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <section className={`gf-glass-card rounded-[32px] p-5 ${className}`}>
      <header className="mb-4">
        {/* The "?" is a sibling of the heading, not a child: a dialog inside a heading is not valid HTML. */}
        <div className="flex items-center">
          <h2 className="text-base font-extrabold text-gf-text">{title}</h2>
          {explain && <Explain title={title} text={explain} />}
        </div>
        {hint && <p className="mt-1 text-xs text-gf-text-muted">{hint}</p>}
      </header>
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, explain }: { label: string; value: string; hint?: React.ReactNode; explain?: string }): React.JSX.Element {
  return (
    <div className="gf-glass-card rounded-[28px] p-5">
      <div className="flex items-center text-xs font-semibold uppercase tracking-wide text-purple-300">
        <span>{label}</span>
        {explain && <Explain title={label} text={explain} />}
      </div>
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

// A list of labelled bars. Each bar is a share of the biggest one. Hover shows the count and its share of the list; a click opens
// the explanation of that row.
export function BarList({
  rows,
  empty = "Sin datos todavía.",
}: {
  rows: { label: string; count: number; note?: string; explain?: string }[];
  empty?: string;
}): React.JSX.Element {
  if (rows.length === 0) return <p className="text-sm text-gf-text-muted">{empty}</p>;
  const max = rows.reduce((top, row) => Math.max(top, row.count), 0) || 1;
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => {
        const share = total > 0 ? Math.round((row.count / total) * 100) : 0;
        return (
          <li key={row.label}>
            <InfoButton
              title={row.label}
              hint={`${count(row.count)} · ${share}% de la lista`}
              body={
                <>
                  {row.explain && <p>{row.explain}</p>}
                  <p>
                    <strong className="text-gf-text">{count(row.count)}</strong> de {count(total)} en esta lista ({share}%).
                    {row.note ? ` ${row.note}.` : ""}
                  </p>
                </>
              }
              className="flex w-full flex-col gap-1 px-1 py-1"
            >
              <span className="flex w-full items-baseline justify-between gap-3 text-sm">
                <span className="truncate text-gf-text">{row.label}</span>
                <span className="shrink-0 tabular-nums text-gf-text-muted">
                  {count(row.count)}
                  {row.note ? ` · ${row.note}` : ""}
                </span>
              </span>
              <span className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <span className="block h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500" style={{ width: `${(row.count / max) * 100}%` }} />
              </span>
            </InfoButton>
          </li>
        );
      })}
    </ul>
  );
}

// One column per day (or per week). Hover shows the label and the count; a click opens the details of that column: its share of
// the period, the running total and how it compares to the average.
export function Columns({
  series,
  label,
  height = "h-36",
  explain,
}: {
  series: { label: string; count: number }[];
  label: string;
  height?: string;
  explain?: string;
}): React.JSX.Element {
  const max = series.reduce((top, entry) => Math.max(top, entry.count), 0) || 1;
  const total = series.reduce((sum, entry) => sum + entry.count, 0);
  const average = series.length > 0 ? total / series.length : 0;
  const peak = series.reduce<{ label: string; count: number } | null>((best, entry) => (!best || entry.count > best.count ? entry : best), null);
  // The running total up to each column, computed before rendering.
  const running = series.map((_, index) => series.slice(0, index + 1).reduce((sum, entry) => sum + entry.count, 0));
  return (
    <figure>
      <div role="img" aria-label={label} className={`flex ${height} items-end gap-1`}>
        {series.map((entry, index) => {
          const share = total > 0 ? Math.round((entry.count / total) * 100) : 0;
          return (
            <div key={entry.label} className="flex h-full flex-1 items-end">
              <InfoButton
                title={`${label}: ${entry.label}`}
                hint={`${count(entry.count)} · ${share}% del periodo`}
                body={
                  <>
                    {explain && <p>{explain}</p>}
                    <ul className="flex flex-col gap-1">
                      <li>
                        Valor de este día: <strong className="text-gf-text">{count(entry.count)}</strong>
                      </li>
                      <li>Participación en el periodo: {share}%</li>
                      <li>Acumulado hasta aquí: {count(running[index])} de {count(total)}</li>
                      <li>Promedio por día del periodo: {average.toFixed(1)}</li>
                      {peak && <li>Día con más actividad: {peak.label} ({count(peak.count)})</li>}
                    </ul>
                  </>
                }
                className="flex h-full w-full items-end"
              >
                <span
                  className="block w-full rounded-t-md bg-gradient-to-t from-purple-600 to-fuchsia-400"
                  style={{ height: `${entry.count > 0 ? Math.max(6, (entry.count / max) * 100) : 2}%`, opacity: entry.count > 0 ? 1 : 0.25 }}
                />
              </InfoButton>
            </div>
          );
        })}
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

export { Explain };
