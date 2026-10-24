"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import type { WalletData } from "@/lib/features/walletSlice";
import { InfoTip } from "./InfoTip";

import { formatMoneyMajor } from "@gastify/core/money/currencies";
import { getPrimaryAmount } from "@gastify/core/transformers/transactionsChange";
import { useT, useInfo } from "@/i18n/client";

const EMPTY: never[] = [];
const COUNT = 5;

// The latest movements of the whole account, whatever period the page shows: the card of the app's home, on the web.
function LatestMovementsCard(): React.JSX.Element {
  const { APP_INFO } = useInfo();
  const t = useT();
  const transactions = useSelector((state: RootState) => state.transacctionsReducer?.data) || EMPTY;
  const primary = useSelector((state: RootState) => (state.walletReducer?.data as WalletData)?.primaryCurrency) || "MXN";
  const latest = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime())
        .slice(0, COUNT),
    [transactions]
  );

  return (
    <section className="gf-glass-card w-full rounded-[32px] border border-gf-border p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-extrabold text-gf-text">{t("movements.latest.title")}</h2>
          <InfoTip info={APP_INFO.ltimos_movimientos_2} />
        </div>
        <Link href="/dashboard/movements" className="text-sm font-bold text-purple-300 transition-colors hover:text-white">
          {t("movements.latest.all")}
        </Link>
      </div>
      {latest.length === 0 ? (
        <p className="text-sm text-gf-text-muted">{t("movements.latest.none")}</p>
      ) : (
        <ul className="flex flex-col">
          {latest.map((transaction) => {
            const income = Boolean(transaction.isIncome);
            const value = Math.abs(getPrimaryAmount(transaction as never));
            return (
              <li key={String(transaction._id)} className="flex items-center justify-between gap-3 border-b border-gf-border py-2.5 last:border-b-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gf-text">{transaction.name || "Movimiento"}</p>
                  <p className="text-[11px] text-gf-text-muted">
                    {new Date(transaction.date as string).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
                <p className={`shrink-0 text-sm font-bold ${income ? "text-emerald-400" : "text-rose-400"}`}>
                  {income ? "+" : "-"}
                  {formatMoneyMajor(value, primary)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default LatestMovementsCard;
