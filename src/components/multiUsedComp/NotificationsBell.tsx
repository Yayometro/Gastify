"use client";

import React, { useState } from "react";
import "animate.css";
import { IoNotificationsOutline, IoCheckmarkCircleOutline } from "react-icons/io5";
import BasicModal from "@/components/modals/basicModal/BasicModal";
import CategoIcon from "./CategoIcon";
import useBudgetAlertList from "@/hooks/useBudgetAlertList";
import { InfoTip } from "./InfoTip";
import { APP_INFO } from "@gastify/core/info/appInfo";
import type { BudgetAlert } from "@gastify/core/budgets/budgetAlerts";

// The bell of the navigation bar: the number of notices that apply now, and the list of them in a window (the same
// notices the app shows). Swiping a notice away in the app is the × here; it leaves with an animation.
const TONE_CLASS: Record<BudgetAlert["tone"], string> = {
  warning: "border-amber-400/60 bg-amber-500/15",
  danger: "border-red-400/60 bg-red-500/15",
  celebrate: "border-emerald-400/60 bg-emerald-500/15",
};

function NotificationsBell(): React.JSX.Element {
  const { alerts, dismiss } = useBudgetAlertList();
  const [open, setOpen] = useState<boolean>(false);
  const [leaving, setLeaving] = useState<string | null>(null);

  const remove = (key: string): void => {
    setLeaving(key);
    window.setTimeout(() => {
      dismiss(key);
      setLeaving(null);
    }, 380);
  };

  return (
    <>
      <button type="button" aria-label="Notificaciones" onClick={() => setOpen(true)} className="relative flex items-center justify-center">
        <IoNotificationsOutline size={28} className="hidden sm:inline" />
        <p className="sm:hidden hoverTooltip">Notificaciones</p>
        {alerts.length > 0 && (
          <span className="animate__animated animate__bounceIn absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {alerts.length}
          </span>
        )}
      </button>

      {open && (
        <BasicModal
          close={() => setOpen(false)}
          renderContent={
            <div className="content absolute gf-glass-violet z-[5001] flex max-h-[80vh] w-[94vw] max-w-[480px] flex-col overflow-hidden rounded-3xl animate__animated animate__zoomIn animate__faster">
              <div className="flex items-center justify-between gap-3 px-6 pb-3 pt-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">Notificaciones</h2>
                  <InfoTip info={APP_INFO.notificaciones} />
                </div>
                <button type="button" aria-label="Cerrar" onClick={() => setOpen(false)} className="rounded-full gf-glass-card p-1.5 text-purple-100 transition-colors hover:text-white">
                  <CategoIcon type={"MdClose"} siz={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 pb-6">
                {alerts.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-center text-gf-text-muted">
                    <IoCheckmarkCircleOutline size={36} className="text-emerald-400" />
                    <p className="text-sm">No hay avisos por ahora. Te avisamos cuando un presupuesto llegue al 70, 80, 90 o 100 %.</p>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {alerts.map((alert) => (
                      <li
                        key={alert.key}
                        className={`rounded-2xl border p-4 ${TONE_CLASS[alert.tone]} ${leaving === alert.key ? "animate__animated animate__fadeOutRight animate__faster" : "animate__animated animate__fadeInDown"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white">{alert.title}</p>
                            <p className="mt-1 text-xs leading-relaxed text-purple-100/90">{alert.message}</p>
                          </div>
                          <button type="button" aria-label={`Quitar el aviso de ${alert.title}`} onClick={() => remove(alert.key)} className="shrink-0 rounded-full p-1 text-purple-100 transition-colors hover:text-white">
                            <CategoIcon type={"MdClose"} siz={16} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          }
        />
      )}
    </>
  );
}

export default NotificationsBell;
