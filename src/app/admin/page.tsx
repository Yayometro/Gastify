import React from "react";
import { getPlatformStats, type PlatformStats, type UserRow } from "@/lib/admin/platformStats";
import type { DayCount } from "@/lib/admin/statsMath";

// Always fresh: the numbers are read from the database on every visit.
export const dynamic = "force-dynamic";

const number = (value: number): string => new Intl.NumberFormat("es-MX").format(Math.round(value));
const percent = (rate: number): string => `${Math.round(rate * 100)}%`;
const dateLabel = (iso: string | null): string => (iso ? new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(new Date(iso)) : "—");

function Card({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-violet-200">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }): React.JSX.Element {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-violet-200/80">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-white/50">{hint}</p>}
    </div>
  );
}

// A list of labelled bars; each bar is a share of the biggest one.
function BarList({ rows }: { rows: { label: string; count: number }[] }): React.JSX.Element {
  const max = rows.reduce((top, row) => Math.max(top, row.count), 0) || 1;
  if (rows.length === 0) return <p className="text-sm text-white/50">Sin datos todavía.</p>;
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => (
        <li key={row.label} className="flex items-center gap-3 text-sm">
          <span className="w-28 shrink-0 truncate text-white/80">{row.label}</span>
          <span className="h-3 flex-1 overflow-hidden rounded-full bg-white/10">
            <span className="block h-full rounded-full bg-violet-400" style={{ width: `${(row.count / max) * 100}%` }} />
          </span>
          <span className="w-10 shrink-0 text-right tabular-nums text-white/80">{number(row.count)}</span>
        </li>
      ))}
    </ul>
  );
}

// One column per day; the title of each column says the day and the count.
function DayBars({ series }: { series: DayCount[] }): React.JSX.Element {
  const max = series.reduce((top, entry) => Math.max(top, entry.count), 0) || 1;
  return (
    <div>
      <div className="flex h-32 items-end gap-1">
        {series.map((entry) => (
          <div key={entry.day} title={`${entry.day}: ${entry.count}`} className="flex h-full flex-1 items-end">
            <div className="w-full rounded-t bg-violet-400/80" style={{ height: `${Math.max(entry.count > 0 ? 4 : 1, (entry.count / max) * 100)}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-white/50">
        <span>{series[0]?.day.slice(5)}</span>
        <span>{series[series.length - 1]?.day.slice(5)}</span>
      </div>
    </div>
  );
}

function UsersTable({ rows }: { rows: UserRow[] }): React.JSX.Element {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-white/50">
          <tr>
            <th className="py-2 pr-3">Cuenta</th>
            <th className="py-2 pr-3">Alta</th>
            <th className="py-2 pr-3">Última actividad</th>
            <th className="py-2 pr-3">Acceso</th>
            <th className="py-2 pr-3">País</th>
            <th className="py-2 pr-3 text-right">Transacciones</th>
            <th className="py-2 pr-3 text-right">Categorías</th>
            <th className="py-2 pr-3 text-right">Cuentas</th>
            <th className="py-2 text-right">Presupuestos</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-white/10">
              <td className="py-2 pr-3 font-mono text-xs">{row.emailMasked}</td>
              <td className="py-2 pr-3">{dateLabel(row.createdAt)}</td>
              <td className="py-2 pr-3">{dateLabel(row.lastActivity)}</td>
              <td className="py-2 pr-3">{row.providers.length > 0 ? row.providers.join(", ") : "—"}</td>
              <td className="py-2 pr-3">{row.country ?? "—"}</td>
              <td className="py-2 pr-3 text-right">{number(row.transactions)}</td>
              <td className="py-2 pr-3 text-right">{number(row.categories)}</td>
              <td className="py-2 pr-3 text-right">{number(row.accounts)}</td>
              <td className="py-2 text-right">{number(row.budgets)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Overview({ stats }: { stats: PlatformStats }): React.JSX.Element {
  const { users, activity, content } = stats;
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-white/50">
        Actualizado: {new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date(stats.generatedAt))}.
        Solo conteos y fechas: aquí no se leen montos, nombres de transacciones ni correos completos. Los documentos iniciales que se
        crean con cada cuenta no se cuentan.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Usuarios" value={number(users.total)} hint={`+${number(users.new7d)} en 7 días · +${number(users.new30d)} en 30 días`} />
        <Stat
          label="Con al menos una transacción"
          value={`${number(users.withTransactions)}`}
          hint={users.total > 0 ? `${percent(users.withTransactions / users.total)} de los usuarios` : undefined}
        />
        <Stat
          label="Activación (30 días)"
          value={percent(users.activation.rate)}
          hint={`${number(users.activation.activated)} de ${number(users.activation.cohort)} altas añadieron una transacción en sus primeros 7 días`}
        />
        <Stat label="Transacciones" value={number(content.transactions)} hint={`${number(content.perUser.average)} por usuario en promedio`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Altas por día (30 días)">
          <DayBars series={activity.signupsByDay} />
        </Card>
        <Card title="Transacciones guardadas por día (30 días)">
          <DayBars series={activity.transactionsByDay} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Usuarios que añadieron datos">
          <BarList
            rows={[
              { label: "Último día", count: activity.addedData.d1 },
              { label: "7 días", count: activity.addedData.d7 },
              { label: "30 días", count: activity.addedData.d30 },
            ]}
          />
        </Card>
        <Card title="Usuarios con sesión activa">
          <BarList
            rows={[
              { label: "Último día", count: activity.sessions.d1 },
              { label: "7 días", count: activity.sessions.d7 },
              { label: "30 días", count: activity.sessions.d30 },
            ]}
          />
          <p className="mt-3 text-xs text-white/50">Las sesiones se borran al vencer o al cerrar sesión: esta cifra se queda corta hacia atrás.</p>
        </Card>
        <Card title="Qué tanto usan la app (transacciones por usuario)">
          <BarList rows={content.perUser.buckets.map((bucket) => ({ label: bucket.label, count: bucket.users }))} />
          <p className="mt-3 text-xs text-white/50">
            Mediana {number(content.perUser.median)} · p90 {number(content.perUser.p90)} · máximo {number(content.perUser.max)}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Qué tienen creado">
          <BarList
            rows={[
              { label: "Transacciones", count: content.transactions },
              { label: "Categorías", count: content.categories },
              { label: "Subcategorías", count: content.subCategories },
              { label: "Cuentas", count: content.accounts },
              { label: "Presupuestos", count: content.budgets },
              { label: "Etiquetas", count: content.tags },
            ]}
          />
        </Card>
        <Card title="Tipo de acceso">
          <BarList rows={users.byProvider} />
          <p className="mt-3 text-xs text-white/50">
            Con passkey: {number(users.withPasskey)} · con 2FA: {number(users.withTwoFactor)} · con token de API: {number(users.withApiToken)}
          </p>
        </Card>
        <Card title="Idioma y país">
          <BarList rows={users.byLanguage} />
          <div className="mt-4">
            <BarList rows={users.byCountry} />
          </div>
        </Card>
      </div>

      <Card title="Cuentas con actividad más reciente">
        <UsersTable rows={stats.recentUsers} />
      </Card>
    </div>
  );
}

export default async function AdminPage(): Promise<React.JSX.Element> {
  const stats = await getPlatformStats();
  return <Overview stats={stats} />;
}
