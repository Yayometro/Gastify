"use client";
import { Spin, Tooltip } from "antd";
import React, { useEffect, useState } from "react";
import CategoIcon from "./CategoIcon";
import runNotify from "@/helpers/gastifyNotifier";
import fetcher from "@/helpers/fetcher";
import { useDispatch } from "react-redux";
import { addNewAccount, removeAccount, updateAccount } from "@/lib/features/accountsSlice";
import { SUPPORTED_CURRENCIES, CURRENCY_META, currencyName } from "@gastify/core/money/currencies";
import { bankCountryForCurrency } from "@gastify/core/banks/banks";
import BankPicker from "./BankPicker";

import TitleWithHelp from "@/components/multiUsedComp/TitleWithHelp";
import { useT, useInfo, useLocale } from "@/i18n/client";

import TutorialTip from "@/components/tour/TutorialTip";
export type EditAccountModalMode = "edition" | "creation" | boolean | string | null | undefined;

export interface EditAccountModalAccount {
  _id?: string;
  name?: string;
  amount?: number;
  accountType?: "debit" | "credit" | "cash" | "savings" | string;
  user?: unknown;
  wallet?: unknown;
  currency?: string;
  allTransactionsList?: unknown[];
  [key: string]: unknown;
}

export interface EditAccountModalWallet {
  _id?: string;
  primaryCurrency?: string;
  [key: string]: unknown;
}

export interface FormAccountState {
  accountId?: string;
  name?: string;
  amount?: number | string;
  accountType?: string;
  currency?: string;
  bankId?: string | null;
  cardNumber?: string | null;
  userId?: unknown;
  walletId?: unknown;
  [key: string]: unknown;
}

export interface EditAccountModalProps {
  eamMode?: EditAccountModalMode;
  eamAccount?: EditAccountModalAccount | null;
  eamWallet?: EditAccountModalWallet | null;
  eamClose: (state: boolean) => void;
  // Inside a panel (the "+" window): no full-screen overlay of its own.
  eamInline?: boolean;
}

function EditAccountModal({ eamMode, eamAccount, eamWallet, eamClose, eamInline = false }: EditAccountModalProps): React.JSX.Element {
  const { APP_INFO } = useInfo();
  const t = useT();
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [active, setActive] = useState<unknown>(false);
  const [formAccount, setFormAccount] = useState<FormAccountState>({
    accountId: "",
    name: "",
    amount: 0,
    accountType: "debit",
    currency: "MXN",
    bankId: null,
    cardNumber: "",
  });
  const toFetch = fetcher();
  //REDUX
  const dispatch = useDispatch();
  // Account currency cannot be changed once Transactions are linked to it -
  // the user must create a correctly denominated Account instead.
  const hasLinkedTransactions = (eamAccount?.allTransactionsList?.length || 0) > 0;
  //
  useEffect(() => {
    if (eamAccount) {
      if (eamMode === "edition") {
        setFormAccount({
          ...formAccount,
          accountId: eamAccount._id,
          name: eamAccount?.name || "",
          amount: eamAccount.amount || 0,
          accountType: eamAccount.accountType || "debit",
          currency: eamAccount.currency || "MXN",
          bankId: (eamAccount.bankId as string) || null,
          cardNumber: ((eamAccount.cardNumber as string) || "").slice(-4),
        });
      } else if (eamMode === "creation") {
        console.log(eamMode);
        setFormAccount({
          accountId: "",
          name: "",
          amount: 0,
          accountType: "debit",
          currency: eamWallet?.primaryCurrency || "MXN",
          bankId: null,
          cardNumber: "",
          userId: eamAccount.user,
          walletId: eamAccount.wallet,
        });
      }
    }
    // console.log(eamMode);
    setActive(eamMode);
  }, [eamMode, eamAccount]);

  // HANDLERS
  const handleClose = () => {
    setActive(false);
    eamClose(false);
  };
  const handleDeletation = async () => {
    try {
      setIsLoading(true);
      const accountId = eamAccount._id;
      const res = await toFetch.post(
        "general-data/accounts/remove-account",
        accountId
      );
      if (res.ok) {
        runNotify("ok", `${res.message}`);
        //REDUX UPDATE
        dispatch(removeAccount(accountId));
        setIsLoading(false);
        handleClose();
        return null;
      } else {
        console.log(res);
      }
    } catch (e) {
      runNotify("error", String(e));
      setIsLoading(false);
      handleClose();
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormAccount({ ...formAccount, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      setIsLoading(true);
      // console.log(formAccount);
      let res;
      if (eamMode === "edition") {
        // console.log(eamMode);
        res = await toFetch.post(
          "general-data/accounts/update-account",
          formAccount
        );
      } else if (eamMode === "creation") {
        // console.log(eamMode)
        const newAcc = {
          ...formAccount,
          userId: eamAccount.user,
          walletId: eamAccount.wallet,
        };
        res = await toFetch.post("general-data/accounts/new-account", newAcc);
      } else {
        runNotify("warning", t("accounts.noAction"));
        setIsLoading(false);
        handleClose();
        return null;
      }
      if (res.ok) {
        runNotify("ok", `${res.message}`);
        //REDUX
        if (eamMode === "edition"){
          dispatch(updateAccount(res.data));
        } else {
          dispatch(addNewAccount(res.data));
        }
        setIsLoading(false);
        handleClose();
        return null;
      }
      setIsLoading(false);
      handleClose();
    } catch (e) {
      console.log(e);
      runNotify("error", String(e));
      setIsLoading(false);
      handleClose();
      return null;
    }
  };

  return (
    <div
      className={
        eamInline
          ? "w-full flex justify-center"
          : `fixed top-[-0%] right-[-0%] w-[100%] h-[100%] z-[5000] bg-black/50 backdrop-blur-md ${
              !active ? "hidden" : "flex"
            } items-center justify-center`
      }
    >
      <div className={eamInline ? "relative flex w-full max-w-[800px] flex-col" : "content gf-glass-violet flex flex-col w-[min(92vw,640px)] h-[820px] max-h-[95vh] overflow-y-auto relative rounded-2xl items-center justify-center pt-[40px] overflow-hidden"}>
        <div
          className={`${
            isLoading ? "absolute" : "hidden"
          } top-0 left-0 bg-gf-surface/70 babackdrop-blur-sm flex justify-center items-center w-full h-full z-[1001] `}
        >
          <Spin size="large" />
        </div>
        {!eamInline && (
          <h1 className="text-center py-[20px] text-2xl text-gf-text">
            {t("accounts.titlePrefix", { p1: eamMode === "edition" ? t("web.edit") : t("web.create") })}
            <span aria-hidden="true" className="mx-2 inline-block h-5 w-px shrink-0 align-middle bg-purple-300/40" /><TutorialTip className="ml-0.5" tour="accForm" label={t("tour.accForm.name")} />
          </h1>
        )}
        <form
          onSubmit={handleSubmit}
          data-tour="acc-form"
          className={eamInline ? "form-trans-edit flex w-full flex-col gap-2 items-start justify-start pb-2" : "form-trans-edit w-[100%] h-full flex flex-col gap-2 items-start justify-start px-10 rounded-t-[60px] pt-[30px] pb-20"}
        >
          {!eamInline && (
            <div
              className="close-con absolute top-[0%] right-[0%] rounded-full gf-glass-card p-1.5 text-purple-100 hover:text-gf-text transition-colors m-2 pulse-animation-short cursor-pointer"
              onClick={handleClose}
            >
              <CategoIcon type={"MdClose"} siz={20} />
            </div>
          )}
          <div className="flex w-full flex-col items-start gap-2" data-tour="acc-form-name">
          <p className="label-tfp ">{t("accounts.form.name")}</p>
          <input
            type="text"
            name="name"
            value={formAccount.name}
            onChange={handleChange}
            placeholder={t("accounts.form.accountName")}
          />
          </div>
          <div className="flex w-full flex-col items-start gap-2" data-tour="acc-form-balance">
          <p className="label-tfp ">{t("accounts.form.balance")}</p>
          <input
            type="number"
            name="amount"
            value={formAccount.amount}
            onChange={handleChange}
            placeholder="0.00"
          />
          </div>
          <div className="flex w-full flex-col items-start gap-2" data-tour="acc-form-currency">
          <p className="label-tfp ">{t("accounts.form.currency")}</p>
          <Tooltip
            title={
              hasLinkedTransactions
                ? t("web.the.currency.can.t.be.changed.once.transactions.are.link")
                : t("web.each.account.has.exactly.one.native.currency")
            }
          >
            <div className="flex w-full flex-wrap gap-2" role="radiogroup" aria-label={t("accounts.form.currency")}>
              {SUPPORTED_CURRENCIES.map((code) => {
                const selected = formAccount.currency === code;
                const locked = eamMode === "edition" && hasLinkedTransactions;
                return (
                  <button
                    key={code}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={locked && !selected}
                    title={currencyName(code, locale)}
                    onClick={() => setFormAccount({ ...formAccount, currency: code })}
                    className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                      selected ? "border-purple-400 bg-purple-500/30 text-gf-text" : "border-white/15 bg-white/5 text-gf-text-muted hover:bg-white/10"
                    } ${locked && !selected ? "cursor-not-allowed opacity-40" : ""}`}
                  >
                    {code} <span className="font-normal opacity-80">{CURRENCY_META[code].symbol}</span>
                  </button>
                );
              })}
            </div>
          </Tooltip>
          </div>
          <div className="flex w-full flex-col items-start gap-2" data-tour="acc-form-bank">
          <TitleWithHelp as="p" title={t("accounts.form.bank")} info={APP_INFO.banco_y_n_mero} titleClassName="label-tfp" />
          <BankPicker country={bankCountryForCurrency(formAccount.currency)} value={formAccount.bankId || null} onChange={(id) => setFormAccount({ ...formAccount, bankId: id })} />
          </div>
          <div className="flex w-full flex-col items-start gap-2" data-tour="acc-form-number">
          <p className="label-tfp ">{t("accounts.form.number")}</p>
          <input
            type="text"
            inputMode="numeric"
            name="cardNumber"
            value={formAccount.cardNumber || ""}
            onChange={(e) => setFormAccount({ ...formAccount, cardNumber: e.target.value.replace(/\D/g, "").slice(0, 4) })}
            placeholder="1234"
            maxLength={4}
            autoComplete="off"
            className="w-[140px]"
          />
          <p className="text-[10px] text-white/70">{t("accounts.form.numberSafety")}</p>
          </div>
          <div className="flex w-full flex-col items-start gap-2" data-tour="acc-form-type">
          <p className="label-tfp ">{t("accounts.form.type")}</p>
          <div className="flex w-full flex-wrap gap-2" role="radiogroup" aria-label={t("accounts.form.type")}>
            {(["debit", "credit", "cash", "savings"] as const).map((type) => {
              const selected = formAccount.accountType === type;
              return (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setFormAccount({ ...formAccount, accountType: type })}
                  className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                    selected ? "border-purple-400 bg-purple-500/30 text-gf-text" : "border-white/15 bg-white/5 text-gf-text-muted hover:bg-white/10"
                  }`}
                >
                  {t(`accounts.type.${type}`)}
                </button>
              );
            })}
          </div>
          </div>
          {eamMode === "edition" ? (
            <button
              type="button"
              data-tour="acc-form-delete"
              className="w-full p-2 gf-glass-button-danger text-white text-center rounded-full mt-2"
              onClick={() => handleDeletation()}
            >
              {t("accounts.remove")}
            </button>
          ) : (
            ""
          )}

          <button
            className="w-full p-2 gf-glass-button text-white text-center rounded-full mt-3"
            type="submit"
            data-tour="acc-form-submit"
          >
            {isLoading ? <Spin /> : t("web.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditAccountModal;
