import React from "react";
import { getPerformance } from "@/lib/admin/platformStats";
import { parseRange, RANGE_DAYS } from "@/lib/admin/statsMath";
import { VITAL_SPECS, type VitalSummary } from "@/lib/admin/metricsMath";
import { EXPLAIN } from "@/lib/admin/explanations";
import { Card, Columns, RangeLinks, Stat, count, dateTimeText, Empty } from "@/components/admin/AdminUi";
import InfoButton from "@/components/admin/InfoButton";

export const dynamic = "force-dynamic";

const VITAL_TITLES: Record<string, string> = {
  LCP: "Carga principal (LCP)",
  INP: "Respuesta a interacciones (INP)",
  CLS: "Estabilidad visual (CLS)",
};

const VITAL_EXPLAIN: Record<string, string> = { LCP: EXPLAIN.lcp, INP: EXPLAIN.inp, CLS: EXPLAIN.cls };

function formatVital(metric: string, value: number | null): string {
  if (value === null) return "—";
  if (metric === "CLS") return value.toFixed(3);
  return `${Math.round(value)} ms`;
}

function VitalCard({ vital }: { vital: VitalSummary }): React.JSX.Element {
  const spec = VITAL_SPECS[vital.metric];
  const goodLabel = vital.metric === "CLS" ? `≤ ${spec.good / 1000}` : `≤ ${spec.good} ms`;
  const poorLabel = vital.metric === "CLS" ? `> ${spec.poor / 1000}` : `> ${spec.poor} ms`;
  const rows = [
    { label: `Buena (${goodLabel})`, share: vital.goodShare, color: "from-emerald-500 to-emerald-300", explain: "Esta parte de las mediciones está dentro del umbral bueno de Google." },
    { label: "Necesita mejora", share: vital.needsShare, color: "from-amber-500 to-amber-300", explain: "Entre el umbral bueno y el malo: se puede mejorar." },
    { label: `Mala (${poorLabel})`, share: vital.poorShare, color: "from-rose-600 to-rose-400", explain: "Por encima del umbral malo: la página se siente lenta o inestable." },
  ];
  return (
    <Card
      title={VITAL_TITLES[vital.metric]}
      hint={`p75 aproximado: ${formatVital(vital.metric, vital.p75)} · ${count(vital.samples)} mediciones`}
      explain={VITAL_EXPLAIN[vital.metric]}
    >
      {vital.samples === 0 ? (
        <Empty>Todavía no hay mediciones en este periodo. Se miden una cuarta parte de las visitas con sesión iniciada.</Empty>
      ) : (
        <div className="flex flex-col gap-3 text-sm">
          {rows.map((row) => (
            <InfoButton
              key={row.label}
              title={`${VITAL_TITLES[vital.metric]}: ${row.label}`}
              hint={`${Math.round(row.share * 100)}% de las mediciones`}
              body={<p>{row.explain}</p>}
              className="flex w-full flex-col gap-1 px-1 py-1"
            >
              <span className="flex w-full justify-between text-gf-text">
                <span>{row.label}</span>
                <span className="tabular-nums text-gf-text-muted">{Math.round(row.share * 100)}%</span>
              </span>
              <span className="block h-2 w-full overflow-hidden rounded-full bg-white/10">
                <span className={`block h-full rounded-full bg-gradient-to-r ${row.color}`} style={{ width: `${row.share * 100}%` }} />
              </span>
            </InfoButton>
          ))}
        </div>
      )}
    </Card>
  );
}

export default async function AdminPerformancePage({ searchParams }: { searchParams: Promise<{ range?: string }> }): Promise<React.JSX.Element> {
  const { range: rawRange } = await searchParams;
  const range = parseRange(rawRange);
  const view = await getPerformance(range);
  const totalRequests = view.routes.reduce((sum, route) => sum + route.requests, 0);
  const totalErrors = view.routes.reduce((sum, route) => sum + Math.round(route.errorRate * route.requests), 0);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <RangeLinks base="/admin/rendimiento" current={range} options={RANGE_DAYS} />
        <a className="gf-glass-inset rounded-full px-4 py-2 text-sm font-semibold text-purple-200 hover:text-white" href={`/api/admin/export?kind=routes&range=${range}`}>
          CSV de rutas
        </a>
      </div>
      <p className="text-xs text-gf-text-muted">
        Actualizado {dateTimeText(view.generatedAt)}. Las rutas de API se miden en el servidor; los Web Vitals llegan de una cuarta parte de
        las visitas. Pasa el cursor sobre un número para ver qué es; haz clic para ver el detalle.
      </p>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Peticiones medidas" value={count(totalRequests)} hint={`en ${range} días, en las rutas instrumentadas`} />
        <Stat
          label="Errores (5xx o excepción)"
          explain={EXPLAIN.errorRate}
          value={count(totalErrors)}
          hint={totalRequests > 0 ? `${Math.round((totalErrors / totalRequests) * 1000) / 10}% de las peticiones` : "sin peticiones"}
        />
        <Stat label="Rutas instrumentadas" value={count(view.routes.length)} hint="session-status, transactions.list, wallet.get, files.upload" />
      </section>

      <Card title="Rutas de API" hint="Peticiones, porcentaje de errores y tiempos. Haz clic en una ruta para ver cómo se reparten sus tiempos." explain={EXPLAIN.routes}>
        {view.routes.length === 0 ? (
          <Empty>Todavía no hay peticiones medidas en este periodo.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm tabular-nums">
              <thead className="text-xs uppercase tracking-wide text-gf-text-muted">
                <tr>
                  <th className="py-2 pr-3">Ruta</th>
                  <th className="py-2 pr-3 text-right">Peticiones</th>
                  <th className="py-2 pr-3 text-right">Errores</th>
                  <th className="py-2 pr-3 text-right">Promedio</th>
                  <th className="py-2 pr-3 text-right">p50</th>
                  <th className="py-2 pr-3 text-right">p95</th>
                  <th className="py-2 text-right">Máximo</th>
                </tr>
              </thead>
              <tbody>
                {view.routes.map((route) => (
                  <tr key={route.route} className="border-t border-gf-border text-gf-text">
                    <td className="py-2 pr-3">
                      <InfoButton
                        title={`Tiempos de ${route.route}`}
                        hint={`${count(route.requests)} peticiones · p95 ${route.p95 === null ? "—" : `≤ ${route.p95} ms`}`}
                        body={
                          <>
                            <p>Cuántas peticiones cayeron en cada rango de tiempo (de la más rápida a la más lenta):</p>
                            <ul className="flex flex-col gap-1">
                              {route.histogram.map((bucket) => (
                                <li key={bucket.label} className="flex justify-between">
                                  <span>{bucket.label}</span>
                                  <span className="tabular-nums text-gf-text">{count(bucket.count)}</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        }
                        className="font-mono text-xs"
                      >
                        <span>{route.route}</span>
                      </InfoButton>
                    </td>
                    <td className="py-2 pr-3 text-right">{count(route.requests)}</td>
                    <td className="py-2 pr-3 text-right">{Math.round(route.errorRate * 1000) / 10}%</td>
                    <td className="py-2 pr-3 text-right">{Math.round(route.averageMs)} ms</td>
                    <td className="py-2 pr-3 text-right">{route.p50 === null ? "—" : `≤ ${route.p50} ms`}</td>
                    <td className="py-2 pr-3 text-right">{route.p95 === null ? "—" : `≤ ${route.p95} ms`}</td>
                    <td className="py-2 text-right">{Math.round(route.maxMs)} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <section className="grid gap-4 lg:grid-cols-3">
        {view.vitals.map((vital) => (
          <VitalCard key={vital.metric} vital={vital} />
        ))}
      </section>

      <Card title="Peticiones por día" hint="Cada columna es un día. Haz clic para ver el número de errores de ese día." explain="Peticiones a las rutas instrumentadas, por día (UTC). El detalle de cada columna muestra también los errores.">
        <Columns
          label="Peticiones por día"
          series={view.daily.map((entry) => ({ label: `${entry.day.slice(5)} · ${entry.errors} err.`, count: entry.requests }))}
        />
      </Card>
    </>
  );
}
