import { Spin, Tooltip } from "antd";
import React, { useEffect, useState } from "react";
import CategoIcon from "./CategoIcon";
import runNotify from "@/helpers/gastifyNotifier";
import fetcher from "@/helpers/fetcher";
import { set } from "mongoose";
import { useDispatch } from "react-redux";
import { addNewAccount, removeAccount, updateAccount } from "@/lib/features/accountsSlice";
import { SUPPORTED_CURRENCIES, CURRENCY_META } from "@/lib/money/currencies";

function EditAccountModal({ eamMode, eamAccount, eamWallet, eamClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [active, setActive] = useState(false);
  const [formAccount, setFormAccount] = useState({
    accountId: "",
    name: "",
    amount: 0,
    accountType: "debit",
    currency: "MXN",
  });
  const toFetch = fetcher();
  //REDUX
  const dispatch = useDispatch()
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
        });
      } else if (eamMode === "creation") {
        console.log(eamMode);
        setFormAccount({
          accountId: "",
          name: "",
          amount: 0,
          accountType: "debit",
          currency: eamWallet?.primaryCurrency || "MXN",
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
      let accountId = eamAccount._id;
      const res = await toFetch.post(
        "general-data/accounts/remove-account",
        accountId
      );
      if (res.ok) {
        runNotify("ok", `${res.message}`);
        //REDUX UPDATE
        dispatch(removeAccount(accountId))
        setIsLoading(false);
        handleClose();
        return null;
      } else {
        console.log(res)
      }
    } catch (e) {
      runNotify("error", String(e));
      setIsLoading(false);
      handleClose();
    }
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormAccount({ ...formAccount, [name]: value });
  };

  const handleSubmit = async (e) => {
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
          dispatch(updateAccount(res.data))
        } else {
          dispatch(addNewAccount(res.data))
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
      className={`fixed top-[-0%] right-[-0%] w-[100%] h-[100%] z-[5000] bg-black/50 backdrop-blur-md ${
        !active ? "hidden" : "flex"
      } items-center justify-center`}
    >
      <div className="content gf-glass-violet flex flex-col w-[350px] h-[650px] relative rounded-2xl items-center justify-center pt-[40px] overflow-hidden">
        <div
          className={`${
            isLoading ? "absolute" : "hidden"
          } top-0 left-0 bg-gf-surface/70 babackdrop-blur-sm flex justify-center items-center w-full h-full z-[1001] `}
        >
          <Spin size="large" />
        </div>
        <h1 className="text-center py-[20px] text-2xl text-white">
          {eamMode === "edition" ? "Edit" : "Create"} Account 🪄
        </h1>
        <form
          onSubmit={handleSubmit}
          className={`form-trans-edit w-[100%] h-full flex flex-col gap-2 items-start justify-start px-10 rounded-t-[60px] pt-[30px] pb-20`}
        >
          <div
            className="close-con absolute top-[0%] right-[0%] rounded-full gf-glass-card p-1.5 text-purple-100 hover:text-white transition-colors m-2 pulse-animation-short cursor-pointer"
            onClick={handleClose}
          >
            <CategoIcon type={"MdClose"} siz={20} />
          </div>
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
