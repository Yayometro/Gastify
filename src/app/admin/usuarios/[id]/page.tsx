import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/betterAuth";
import { isObjectIdString } from "@/lib/admin/audit";
import { getUserDetail } from "@/lib/admin/platformStats";
import { revokeUserSessions } from "./actions";
import ConfirmSubmitButton from "@/components/admin/ConfirmSubmitButton";
import { BarList, Card, Empty, Stat, count, dateText, dateTimeText } from "@/components/admin/AdminUi";
import { PLAN_LABELS, planOf } from "@/lib/admin/plans";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  self: "Esta es tu propia cuenta: no puedes cerrar tus sesiones desde aquí, para no quedarte fuera del panel.",
};

export default async function AdminUserPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ revoked?: string; error?: string }>;
}): Promise<React.JSX.Element> {
  const { id } = await params;
  const { revoked, error } = await searchParams;
  if (!isObjectIdString(id)) notFound();
  const detail = await getUserDetail(id);
  if (!detail) notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  const isSelf = session?.user?.id === id;

  return (
    <>
      <Link href="/admin" className="text-sm font-semibold text-purple-300 hover:text-white">
        ‹ Volver al resumen
      </Link>

      <header className="gf-glass-card rounded-[32px] p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-purple-300">Cuenta</p>
        <h2 className="mt-1 font-mono text-xl font-extrabold text-gf-text">{detail.emailMasked}</h2>
        <p className="mt-2 text-sm text-gf-text-muted">
          Alta {dateText(detail.createdAt)} · última actividad {dateTimeText(detail.lastActivity)} · plan {PLAN_LABELS[planOf(detail.plan)]}
        </p>
      </header>

      {revoked !== undefined && (
        <p className="gf-glass-success rounded-2xl p-4 text-sm text-gf-text">
          Sesiones cerradas: {count(Number(revoked) || 0)}. La acción quedó en la auditoría.
        </p>
      )}
      {error && ERRORS[error] && <p className="gf-glass-warning rounded-2xl p-4 text-sm text-gf-text">{ERRORS[error]}</p>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Transacciones" value={count(detail.counts.transactions)} />
        <Stat label="Categorías" value={count(detail.counts.categories)} />
        <Stat label="Cuentas" value={count(detail.counts.accounts)} />
        <Stat label="Presupuestos" value={count(detail.counts.budgets)} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card title="Acceso y seguridad">
          <BarList
            rows={[
              { label: "Proveedores de acceso", count: detail.providers.length, note: detail.providers.join(", ") || "ninguno" },
              { label: "Passkey", count: detail.hasPasskey ? 1 : 0, note: detail.hasPasskey ? "sí" : "no" },
              { label: "Verificación en dos pasos", count: detail.hasTwoFactor ? 1 : 0, note: detail.hasTwoFactor ? "sí" : "no" },
              { label: "Tokens de API", count: detail.apiTokens },
              { label: "Sesiones abiertas", count: detail.activeSessions },
            ]}
            empty="Sin datos."
          />
        </Card>
        <Card title="Perfil">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <dt className="text-gf-text-muted">Idioma</dt>
            <dd className="text-gf-text">{detail.language ?? "automático"}</dd>
            <dt className="text-gf-text-muted">País</dt>
            <dd className="text-gf-text">{detail.country ?? "—"}</dd>
            <dt className="text-gf-text-muted">Primera transacción</dt>
            <dd className="text-gf-text">{dateText(detail.firstTransactionAt)}</dd>
          </dl>
          <p className="mt-4 text-xs text-gf-text-muted">
            El nombre, el correo completo y los montos no se muestran en el panel.
          </p>
        </Card>
      </section>

      <Card title="Acciones" hint="Cada acción queda registrada en la auditoría. Cerrar las sesiones saca a la persona de todos sus dispositivos.">
        {isSelf ? (
          <Empty>{ERRORS.self}</Empty>
        ) : (
          <form action={revokeUserSessions} className="flex flex-wrap items-center gap-4">
            <input type="hidden" name="userId" value={id} />
            <ConfirmSubmitButton message="¿Cerrar todas las sesiones de esta cuenta? La persona tendrá que volver a iniciar sesión en todos sus dispositivos.">
              Cerrar todas sus sesiones
            </ConfirmSubmitButton>
            <span className="text-xs text-gf-text-muted">Sesiones abiertas ahora: {count(detail.activeSessions)}</span>
          </form>
        )}
      </Card>

      <Card title="Auditoría de esta cuenta">
        {detail.audit.length === 0 ? (
          <Empty>No hay acciones registradas sobre esta cuenta.</Empty>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {detail.audit.map((entry) => (
              <li key={entry.id} className="flex flex-wrap justify-between gap-2 border-t border-gf-border pt-2 text-gf-text">
                <span>{entry.detail}</span>
                <span className="text-gf-text-muted">
                  {entry.adminEmail} · {dateTimeText(entry.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
