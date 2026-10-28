import React from "react";
import Link from "next/link";
import { getOverview } from "@/lib/admin/platformStats";
import { parseRange, RANGE_DAYS, RETENTION_HORIZONS } from "@/lib/admin/statsMath";
import { USAGE_EVENTS } from "@/lib/admin/metrics";
import { Card, Columns, BarList, RangeLinks, Stat, count, dateText, percentText, Empty } from "@/components/admin/AdminUi";

// Always fresh: the numbers are read from the database on every visit.
export const dynamic = "force-dynamic";

const USAGE_LABELS: Record<string, string> = {
  "dashboard.visit": "Visitas a la billetera",
  "template.upload": "Plantillas de Excel cargadas",
  "mcp.call": "Llamadas de agentes (MCP)",
};

export default async function AdminOverviewPage({ searchParams }: { searchParams: Promise<{ range?: string }> }): Promise<React.JSX.Element> {
  const { range: rawRange } = await searchParams;
  const range = parseRange(rawRange);
  const stats = await getOverview(range);
  const { users, activity, content } = stats;
  const exportBase = `/api/admin/export?range=${range}&kind`;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <RangeLinks base="/admin" current={range} options={RANGE_DAYS} />
        <div className="flex flex-wrap gap-2 text-sm">
          <a className="gf-glass-inset rounded-full px-4 py-2 font-semibold text-purple-200 hover:text-white" href={`${exportBase}=daily`}>
            CSV diario
          </a>
          <a className="gf-glass-inset rounded-full px-4 py-2 font-semibold text-purple-200 hover:text-white" href={`${exportBase}=cohorts`}>
            CSV cohortes
          </a>
          <a className="gf-glass-inset rounded-full px-4 py-2 font-semibold text-purple-200 hover:text-white" href={`${exportBase}=routes`}>
            CSV rutas
          </a>
        </div>
      </div>
      <p className="text-xs text-gf-text-muted">
        Actualizado {dateText(stats.generatedAt)}. Solo conteos y fechas: aquí no se leen montos, nombres de transacciones ni correos
        completos. Los documentos de arranque de cada cuenta no se cuentan.
      </p>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Usuarios" value={count(users.total)} hint={`+${count(users.newInRange)} en ${range} días · +${count(users.new7d)} en 7`} />
        <Stat
          label={`Activación (${range} días)`}
          value={percentText(users.activation.rate)}
          hint={`${count(users.activation.activated)} de ${count(users.activation.cohort)} altas añadieron una transacción en sus primeros 7 días`}
        />
        <Stat
          label="Activos al mes"
          value={count(activity.mau)}
          hint={`${count(activity.wau)} activos en la última semana · ${percentText(activity.stickiness)} de los mensuales vuelven cada semana`}
        />
        <Stat
          label="Transacciones"
          value={count(content.transactions)}
          hint={`Mediana ${count(content.perUser.median)} por usuario · p90 ${count(content.perUser.p90)}`}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card title="Altas por día" hint={`Últimos ${range} días`}>
          <Columns label="Altas por día" series={activity.signupsByDay.map((entry) => ({ label: entry.day.slice(5), count: entry.count }))} />
        </Card>
        <Card title="Transacciones guardadas por día" hint={`Últimos ${range} días`}>
          <Columns label="Transacciones por día" series={activity.transactionsByDay.map((entry) => ({ label: entry.day.slice(5), count: entry.count }))} />
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {USAGE_EVENTS.map((event) => {
          const usage = stats.usage.find((entry) => entry.event === event);
          return (
            <Card key={event} title={USAGE_LABELS[event] ?? event} hint={`${count(usage?.total ?? 0)} en ${range} días`}>
              <Columns label={USAGE_LABELS[event] ?? event} height="h-20" series={(usage?.series ?? []).map((entry) => ({ label: entry.day.slice(5), count: entry.count }))} />
            </Card>
          );
        })}
      </section>

      <Card title="Retención por semana de alta" hint="Cada fila es una semana de altas. Cada columna: de quienes se registraron esa semana, cuántos añadieron una transacción en su semana N después del alta. Vacío (—) mientras la ventana no termine.">
        {stats.cohorts.every((row) => row.signups === 0) ? (
          <Empty>Todavía no hay altas en las últimas 12 semanas.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm tabular-nums">
              <thead className="text-xs uppercase tracking-wide text-gf-text-muted">
                <tr>
                  <th className="py-2 pr-3">Semana</th>
                  <th className="py-2 pr-3 text-right">Altas</th>
                  {RETENTION_HORIZONS.map((horizon) => (
                    <th key={horizon} className="py-2 pr-3 text-right">Semana {horizon}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.cohorts.map((row) => (
                  <tr key={row.week} className="border-t border-gf-border">
                    <td className="py-2 pr-3 text-gf-text">{row.week}</td>
                    <td className="py-2 pr-3 text-right text-gf-text">{count(row.signups)}</td>
                    {row.retention.map((entry) => (
                      <td key={entry.weeks} className="py-2 pr-3 text-right">
                        <span className="inline-block min-w-[3.5rem] rounded-full px-2 py-0.5 text-center text-gf-text" style={{ background: entry.rate === null ? "transparent" : `rgba(168, 85, 247, ${0.12 + entry.rate * 0.5})` }}>
                          {percentText(entry.rate)}
                        </span>
                        {entry.eligible > 0 && <span className="ml-1 text-xs text-gf-text-muted">n={entry.eligible}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card title="Actividad semanal" hint="Personas distintas con al menos una transacción en cada una de las últimas 12 semanas.">
          <Columns label="Actividad semanal" series={activity.weeklyActive.map((entry) => ({ label: entry.week.slice(5), count: entry.users }))} />
        </Card>
        <Card title="Historial diario de totales" hint="Un registro por día, guardado cada vez que se abre el panel.">
          {activity.snapshots.length === 0 ? (
            <Empty>Todavía no hay registros guardados en este periodo. Se guardan a partir de hoy.</Empty>
          ) : (
            <Columns label="Usuarios por día" series={activity.snapshots.map((entry) => ({ label: entry.day.slice(5), count: entry.users }))} />
          )}
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card title="Usuarios que añadieron datos" hint="Personas que guardaron una transacción en el periodo indicado.">
          <BarList
            rows={[
              { label: "Último día", count: activity.addedData.d1 },
              { label: "Últimos 7 días", count: activity.addedData.d7 },
              { label: "Últimos 30 días", count: activity.addedData.d30 },
            ]}
          />
        </Card>
        <Card title="Sesiones activas" hint="Se borran al vencer o al cerrar sesión, así que esta cifra se queda corta hacia atrás.">
          <BarList
            rows={[
              { label: "Último día", count: activity.sessions.d1 },
              { label: "Últimos 7 días", count: activity.sessions.d7 },
              { label: "Últimos 30 días", count: activity.sessions.d30 },
            ]}
          />
        </Card>
        <Card title="Qué tanto usan la app" hint="Transacciones por persona.">
          <BarList rows={content.perUser.buckets.map((bucket) => ({ label: `${bucket.label} transacciones`, count: bucket.users }))} />
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
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
        <Card title="Tipo de acceso" hint={`Con passkey ${count(users.withPasskey)} · con 2FA ${count(users.withTwoFactor)} · con token de API ${count(users.withApiToken)}`}>
          <BarList rows={users.byProvider} />
        </Card>
        <Card title="Idioma y país">
          <BarList rows={users.byLanguage} />
          <div className="mt-5">
            <BarList rows={users.byCountry} />
          </div>
        </Card>
      </section>

      <Card title="Cuentas con actividad más reciente" hint="Toca una para ver su detalle y sus acciones.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm tabular-nums">
            <thead className="text-xs uppercase tracking-wide text-gf-text-muted">
              <tr>
                <th className="py-2 pr-3">Cuenta</th>
                <th className="py-2 pr-3">Alta</th>
                <th className="py-2 pr-3">Última actividad</th>
                <th className="py-2 pr-3">Acceso</th>
                <th className="py-2 pr-3">País</th>
                <th className="py-2 pr-3">Plan</th>
                <th className="py-2 pr-3 text-right">Transacciones</th>
                <th className="py-2 pr-3 text-right">Categorías</th>
                <th className="py-2 text-right">Presupuestos</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentUsers.map((row) => (
                <tr key={row.id} className="border-t border-gf-border">
                  <td className="py-2 pr-3">
                    <Link href={`/admin/usuarios/${row.id}`} className="font-mono text-xs text-purple-200 underline-offset-4 hover:underline">
                      {row.emailMasked}
                    </Link>
                  </td>
                  <td className="py-2 pr-3 text-gf-text">{dateText(row.createdAt)}</td>
                  <td className="py-2 pr-3 text-gf-text">{dateText(row.lastActivity)}</td>
                  <td className="py-2 pr-3 text-gf-text-muted">{row.providers.join(", ") || "—"}</td>
                  <td className="py-2 pr-3 text-gf-text-muted">{row.country ?? "—"}</td>
                  <td className="py-2 pr-3 text-gf-text-muted">{row.plan === "pro" ? "Pro" : "Gratis"}</td>
                  <td className="py-2 pr-3 text-right text-gf-text">{count(row.transactions)}</td>
                  <td className="py-2 pr-3 text-right text-gf-text">{count(row.categories)}</td>
                  <td className="py-2 text-right text-gf-text">{count(row.budgets)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
