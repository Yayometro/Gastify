"use client";

import React, { useId, useState } from "react";
import { MdKeyboardDoubleArrowUp, MdKeyboardDoubleArrowDown, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { bankById, formatCardNumber } from "@gastify/core/banks/banks";
import { formatMoneyMajor } from "@gastify/core/money/currencies";
import { ACCOUNT_TYPES } from "@gastify/core/accounts/accountForm";
import { accountGradient } from "@gastify/core/accounts/accountActivity";
import { cardPalette } from "@gastify/core/accounts/cardPalette";
import { useT } from "@/i18n/client";

// The account drawn as a card, the same as the phone draws it: its color and its pattern (both saved on the account), the
// bank, the name and the kind, the balance in its own currency with its equivalent, the card number that can be revealed,
// and what came in and went out in the period. The text takes its color from the card so it always reads.

const TILE_PATTERNS = ["dots", "stripes", "grid", "waves"];

function CardPatternLayer({ pattern, tint, id }: { pattern: string; tint: (alpha: number) => string; id: string }): React.JSX.Element | null {
  if (pattern === "plain") return null;
  if (pattern === "circles" || !TILE_PATTERNS.includes(pattern)) {
    return (
      <>
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-[150px] w-[150px] rounded-full" style={{ background: tint(0.12) }} />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-[60px] right-[30px] h-[130px] w-[130px] rounded-full" style={{ background: tint(0.08) }} />
      </>
    );
  }
  const tile = pattern === "waves" ? 24 : pattern === "dots" ? 18 : 14;
  const stroke = tint(0.16);
  const patternId = `acp-${id}`;
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full">
      <defs>
        <pattern id={patternId} width={tile} height={tile} patternUnits="userSpaceOnUse">
          {pattern === "dots" && <circle cx={tile / 2} cy={tile / 2} r={1.8} fill={tint(0.22)} />}
          {pattern === "stripes" && (
            <path d={`M0 ${tile} L${tile} 0 M-${tile / 2} ${tile / 2} L${tile / 2} -${tile / 2} M${tile / 2} ${tile + tile / 2} L${tile + tile / 2} ${tile / 2}`} stroke={stroke} strokeWidth={2} />
          )}
          {pattern === "grid" && <path d={`M0 0 L${tile} 0 L${tile} ${tile} L0 ${tile} Z`} fill="none" stroke={stroke} strokeWidth={1} />}
          {pattern === "waves" && <path d="M0 12 Q6 4 12 12 T24 12" fill="none" stroke={stroke} strokeWidth={2} />}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}

export interface AccountCardFaceProps {
  seed: string;
  name?: string | null;
  bankId?: string | null;
  accountType?: string | null;
  cardNumber?: string | null;
  cardColor?: string | null;
  cardPattern?: string | null;
  currency: string;
  balance: number;
  equivalent?: string | null;
  incomes: number;
  spending: number;
  flowCurrency: string;
  onOpen?: () => void;
}

function AccountCardFace({
  seed,
  name,
  bankId,
  accountType,
  cardNumber,
  cardColor,
  cardPattern,
  currency,
  balance,
  equivalent,
  incomes,
  spending,
  flowCurrency,
  onOpen,
}: AccountCardFaceProps): React.JSX.Element {
  const t = useT();
  const [reveal, setReveal] = useState<boolean>(false);
  const patternId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const { stops, ink, tint, light } = cardPalette(cardColor, accountGradient(seed || name || t("budgets.account")));
  const bank = bankById(bankId);
  const typeKey = ACCOUNT_TYPES.find((option) => option.value === accountType)?.label;
  const typeLabel = typeKey ? t(typeKey) : accountType ?? t("accounts.type.debit");
  const up = light ? "#15803d" : "#86efac";
  const down = light ? "#be123c" : "#fda4af";

  return (
    <div
      className="relative flex h-[200px] w-[300px] shrink-0 flex-col justify-between overflow-hidden rounded-[26px] p-[18px] text-left shadow-2xl"
      style={{
        background: `linear-gradient(135deg, ${stops.join(", ")})`,
        border: light ? "1px solid rgba(17,24,39,0.12)" : undefined,
        color: ink,
      }}
    >
      <CardPatternLayer pattern={cardPattern ?? "circles"} tint={tint} id={patternId} />

      <div className="relative flex items-center justify-between gap-3">
        {bank ? (
          <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1" title={bank.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/banks/${bank.id}.webp`} alt={bank.name} className="h-full w-full object-contain" />
          </div>
        ) : null}
        <button
          type="button"
          onClick={onOpen}
          disabled={!onOpen}
          className="min-w-0 flex-1 truncate text-left text-lg font-semibold"
          style={{ color: ink }}
        >
          {name || t("dashboard.bulk.account")}
        </button>
        <span className="shrink-0 rounded-[10px] px-2 py-[3px] text-[11px] font-medium" style={{ background: tint(0.22), color: ink }}>
          {typeLabel}
        </span>
      </div>

      <div className="relative">
        <p className="text-xs font-medium" style={{ color: tint(0.8) }}>
          {currency}
          {bank ? ` · ${bank.name}` : ""}
        </p>
        <p className="truncate text-3xl font-bold" style={{ color: ink }}>
          {formatMoneyMajor(balance, currency, { showCode: false })}
        </p>
        {equivalent ? (
          <p className="text-xs" style={{ color: tint(0.85) }}>
            {equivalent}
          </p>
        ) : null}
      </div>

      {cardNumber ? (
        <button
          type="button"
          aria-label={reveal ? t("web.hide.the.number") : t("web.show.the.number")}
          onClick={(event) => {
            event.stopPropagation();
            setReveal((value) => !value);
          }}
          className="relative flex items-center gap-2 self-start text-sm font-medium"
          style={{ color: tint(0.92), letterSpacing: "0.1em" }}
        >
          {formatCardNumber(cardNumber, reveal)}
          {reveal ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
        </button>
      ) : null}

      <div className="relative flex items-center justify-between gap-3">
        <span className="flex items-center gap-1 text-sm font-semibold" style={{ color: ink }}>
          <MdKeyboardDoubleArrowUp size={18} style={{ color: up }} />
          {formatMoneyMajor(incomes, flowCurrency, { showCode: false })}
        </span>
        <span className="flex items-center gap-1 text-sm font-semibold" style={{ color: ink }}>
          <MdKeyboardDoubleArrowDown size={18} style={{ color: down }} />
          {formatMoneyMajor(spending, flowCurrency, { showCode: false })}
        </span>
      </div>
    </div>
  );
}

export default AccountCardFace;
