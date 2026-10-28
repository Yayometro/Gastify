import React from "react";
import { getOverview } from "@/lib/admin/platformStats";
import { parseRange, RANGE_DAYS } from "@/lib/admin/statsMath";
import { RangeLinks, Stat, Card, count, Empty } from "@/components/admin/AdminUi";
import { EXPLAIN } from "@/lib/admin/explanations";

export const dynamic = "force-dynamic";

export default async function AdminRevenuePage({ searchParams }: { searchParams: Promise<{ range?: string }> }): Promise<React.JSX.Element> {
  const { range: rawRange } = await searchParams;
  const range = parseRange(rawRange);
  const stats = await getOverview(range);
  const totalAccounts = stats.revenue.reduce((sum, plan) => sum + plan.accounts, 0);
  const pro = stats.revenue.find((plan) => plan.plan === "pro");
  const priced = stats.revenue.every((plan) => plan.monthlyMXN !== null);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <RangeLinks base="/admin/ingresos" current={range} options={RANGE_DAYS} />
      </div>

      <Empty>
        Gastify todavía no cobra: todas las cuentas están en el plan gratis y no hay pasarela de pago. Esta página se llena cuando exista
        la suscripción; mientras tanto muestra cuántas cuentas hay en cada plan y lo que sumarían con los precios que se definan.
      </Empty>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Cuentas" explain={EXPLAIN.revenue} value={count(totalAccounts)} hint="todas las cuentas registradas" />
        <Stat label="Cuentas Pro" value={count(pro?.accounts ?? 0)} hint="según el campo de plan (vacío = gratis)" />
        <Stat
          label="Ingreso mensual"
          value={priced ? `MXN ${count(stats.revenue.reduce((sum, plan) => sum + (plan.monthlyMXN ?? 0), 0))}` : "—"}
          hint={priced ? "cuentas × precio de lista" : "sin precio definido para el plan Pro"}
        />
      </section>

      <Card title="Cuentas por plan" hint="Los precios se definen en src/lib/admin/plans.ts. Mientras sean null, el ingreso no se calcula." explain={EXPLAIN.revenue}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm tabular-nums">
            <thead className="text-xs uppercase tracking-wide text-gf-text-muted">
              <tr>
                <th className="py-2 pr-3">Plan</th>
                <th className="py-2 pr-3 text-right">Cuentas</th>
                <th className="py-2 pr-3 text-right">Precio mensual</th>
                <th className="py-2 text-right">Ingreso mensual</th>
              </tr>
            </thead>
            <tbody>
              {stats.revenue.map((plan) => (
                <tr key={plan.plan} className="border-t border-gf-border text-gf-text">
                  <td className="py-2 pr-3">{plan.label}</td>
                  <td className="py-2 pr-3 text-right">{count(plan.accounts)}</td>
                  <td className="py-2 pr-3 text-right">{plan.plan === "free" ? "Gratis" : "sin precio definido"}</td>
                  <td className="py-2 text-right">{plan.monthlyMXN === null ? "—" : `MXN ${count(plan.monthlyMXN)}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Lo que medirá esta página cuando haya cobro" hint="Pendiente: depende de la decisión de precios y de la pasarela.">
        <ul className="list-disc space-y-2 pl-5 text-sm text-gf-text-muted">
          <li>Ingreso recurrente mensual (MRR) y anual (ARR), por plan.</li>
          <li>Conversión de gratis a Pro, y cuánto tarda en pagar desde el alta.</li>
          <li>Cancelaciones (churn) y retención de pagos por mes de alta.</li>
          <li>Uso de la prueba gratis y de cada función de pago.</li>
        </ul>
      </Card>
    </>
  );
}
