import { Spin, Tooltip } from "antd";
import React, { useEffect, useState } from "react";
import CategoIcon from "./CategoIcon";
import runNotify from "@/helpers/gastifyNotifier";
import fetcher from "@/helpers/fetcher";
import { useDispatch } from "react-redux";
import { addNewAccount, removeAccount, updateAccount } from "@/lib/features/accountsSlice";
import { SUPPORTED_CURRENCIES, CURRENCY_META } from "@gastify/core/money/currencies";
import { BANKS, bankById } from "@gastify/core/banks/banks";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import { APP_INFO } from "@gastify/core/info/appInfo";
import { InfoTip } from "@/components/multiUsedComp/InfoTip";

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
  const [bankQuery, setBankQuery] = useState<string>("");
  const [showNumber, setShowNumber] = useState<boolean>(false);
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
          cardNumber: (eamAccount.cardNumber as string) || "",
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
        runNotify("warning", "No action taked to perform a change");
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
      <div className={eamInline ? "relative flex w-full max-w-[460px] flex-col" : "content gf-glass-violet flex flex-col w-[350px] h-[820px] max-h-[95vh] overflow-y-auto relative rounded-2xl items-center justify-center pt-[40px] overflow-hidden"}>
        <div
          className={`${
            isLoading ? "absolute" : "hidden"
          } top-0 left-0 bg-gf-surface/70 babackdrop-blur-sm flex justify-center items-center w-full h-full z-[1001] `}
        >
          <Spin size="large" />
        </div>
        {!eamInline && (
          <h1 className="text-center py-[20px] text-2xl text-white">
            {eamMode === "edition" ? "Edit" : "Create"} Account 🪄
          </h1>
        )}
        <form
          onSubmit={handleSubmit}
          className={eamInline ? "form-trans-edit flex w-full flex-col gap-2 items-start justify-start pb-2" : "form-trans-edit w-[100%] h-full flex flex-col gap-2 items-start justify-start px-10 rounded-t-[60px] pt-[30px] pb-20"}
        >
          {!eamInline && (
            <div
              className="close-con absolute top-[0%] right-[0%] rounded-full gf-glass-card p-1.5 text-purple-100 hover:text-white transition-colors m-2 pulse-animation-short cursor-pointer"
              onClick={handleClose}
            >
              <CategoIcon type={"MdClose"} siz={20} />
            </div>
          )}
          <p className="label-tfp ">Name</p>
          <input
            type="text"
            name="name"
            value={formAccount.name}
            onChange={handleChange}
            placeholder="Account Name"
          />
          <p className="label-tfp ">Current Balance</p>
          <input
            type="number"
            name="amount"
            value={formAccount.amount}
            onChange={handleChange}
            placeholder="0.00"
          />
          <p className="label-tfp ">Currency</p>
          <Tooltip
            title={
              hasLinkedTransactions
                ? "Currency can't be changed once transactions are linked to this account. Create a new account in the target currency instead."
                : "Each account has exactly one native currency."
            }
          >
            <div className="etm-selector bg-gf-surface text-gf-text w-full flex items-center justify-center px-[4px] py-[2px] text-center">
              <select
                className="bg-transparent appearance-none w-full pr-4"
                name="currency"
                value={formAccount.currency}
                onChange={handleChange}
                disabled={eamMode === "edition" && hasLinkedTransactions}
              >
                {SUPPORTED_CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {code} ({CURRENCY_META[code].symbol}) - {CURRENCY_META[code].label}
                  </option>
                ))}
              </select>
            </div>
          </Tooltip>
          <p className="label-tfp ">Bank (optional)<InfoTip info={APP_INFO.banco_y_n_mero} /></p>
          <input
            type="text"
            value={bankQuery}
            onChange={(e) => setBankQuery(e.target.value)}
            placeholder="Search bank…"
          />
          <div className="etm-selector bg-gf-surface text-gf-text w-full flex items-center justify-center px-[4px] py-[2px] text-center">
            <select
              className="bg-transparent appearance-none w-full pr-4"
              name="bankId"
              value={formAccount.bankId || ""}
              onChange={(e) => setFormAccount({ ...formAccount, bankId: e.target.value || null })}
            >
              <option value="">No bank</option>
              {BANKS.filter((b) => b.id === formAccount.bankId || !bankQuery.trim() || b.name.toLowerCase().includes(bankQuery.trim().toLowerCase())).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          {bankById(formAccount.bankId) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/banks/${formAccount.bankId}.webp`} alt="" className="bg-white rounded-xl p-1 w-10 h-10 object-contain" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
          ) : null}
          <p className="label-tfp ">Card or account number (optional)</p>
          <div className="flex items-center gap-2 w-full">
            <input
              type={showNumber ? "text" : "password"}
              inputMode="numeric"
              name="cardNumber"
              value={formAccount.cardNumber || ""}
              onChange={(e) => setFormAccount({ ...formAccount, cardNumber: e.target.value.replace(/[^\d\s-]/g, "") })}
              placeholder="Only if you want it at hand"
              maxLength={23}
              autoComplete="off"
            />
            <button type="button" className="text-white text-xl" onClick={() => setShowNumber((v) => !v)} aria-label={showNumber ? "Hide number" : "Show number"}>
              {showNumber ? <MdVisibilityOff /> : <MdVisibility />}
            </button>
          </div>
          <p className="text-[10px] text-white/70">Optional. We never ask for or store the CVV or PIN.</p>
          <p className="label-tfp ">Account Type</p>
          <div className="etm-selector bg-gf-surface text-gf-text w-full flex items-center justify-center px-[4px] py-[2px] text-center">
            <select
              className="bg-transparent appearance-none w-full pr-4"
              name="accountType"
              value={formAccount.accountType}
              onChange={handleChange}
            >
              <option value="debit">Debit</option>
              <option value="credit">Credit</option>
              <option value="cash">Cash</option>
              <option value="savings">Savings</option>
            </select>
          </div>
          {eamMode === "edition" ? (
            <button
              type="button"
              className="w-full p-2 gf-glass-button-danger text-white text-center rounded-full mt-2"
              onClick={() => handleDeletation()}
            >
              Remove account
            </button>
          ) : (
            ""
          )}

          <button
            className="w-full p-2 gf-glass-button text-white text-center rounded-full mt-3"
            type="submit"
          >
            {isLoading ? <Spin /> : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditAccountModal;
