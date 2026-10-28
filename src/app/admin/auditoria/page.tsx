import React from "react";
import { readAudit, AUDIT_ACTIONS } from "@/lib/admin/audit";
import { Card, Empty, dateTimeText } from "@/components/admin/AdminUi";

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, string> = {
  revoke_sessions: "Cerrar todas las sesiones",
};

export default async function AdminAuditPage(): Promise<React.JSX.Element> {
  const entries = await readAudit(200);
  return (
    <Card
      title="Auditoría de acciones"
      hint={`Cada acción sobre una cuenta queda registrada aquí y no se puede borrar desde el panel. Acciones posibles: ${AUDIT_ACTIONS.map((action) => ACTION_LABELS[action]).join(", ")}.`}
    >
      {entries.length === 0 ? (
        <Empty>Todavía no se ha hecho ninguna acción desde el panel.</Empty>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-gf-text-muted">
              <tr>
                <th className="py-2 pr-3">Fecha</th>
                <th className="py-2 pr-3">Acción</th>
                <th className="py-2 pr-3">Admin</th>
                <th className="py-2 pr-3">Cuenta</th>
                <th className="py-2">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-t border-gf-border text-gf-text">
                  <td className="py-2 pr-3 tabular-nums">{dateTimeText(entry.at)}</td>
                  <td className="py-2 pr-3">{ACTION_LABELS[entry.action] ?? entry.action}</td>
                  <td className="py-2 pr-3 text-gf-text-muted">{entry.adminEmail}</td>
                  <td className="py-2 pr-3">
                    <a href={`/admin/usuarios/${entry.targetUserId}`} className="font-mono text-xs text-purple-200 underline-offset-4 hover:underline">
                      {entry.targetUserId.slice(-8)}
                    </a>
                  </td>
                  <td className="py-2 text-gf-text-muted">{entry.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
