"use client";

import { useState, useEffect } from "react";
import { Spin, Tooltip } from "antd";
import { DemoContainer, DemoItem } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { MobileDateTimePicker } from "@mui/x-date-pickers/MobileDateTimePicker";
import dayjs from "dayjs";
import { useDispatch } from "react-redux";
import fetcher from "@/helpers/fetcher";
import runNotify from "@/helpers/gastifyNotifier";
import useGetDataFromProvider from "@/hooks/getAllInfo/useGetInfoFromProvider";
import { addNewTransacctions } from "@/lib/features/transacctionsSlice";
import { majorToMinor, minorToMajor } from "@/lib/money/currencies";

const EMPTY_FORM = {
  name: "",
  sourceAccountId: "",
  sourceAmount: "",
  destinationAccountId: "",
  destinationAmount: "",
  date: new Date(),
};

// Internal transfer/exchange between two of the user's own Accounts - never
// treated as income or spending (plan section 2.6/13). "transfer" requires
// both Accounts to share a currency; a currency mismatch is automatically
// treated as an "exchange" and gets a live rate suggestion the user can
// override to reflect the exact rate their bank actually used.
function TransferExchangeModal() {
  const dispatch = useDispatch();
  const toFetch = fetcher();
  const { user, wallet, accounts = [] } = useGetDataFromProvider();
  const [form, setForm] = useState(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [destinationTouched, setDestinationTouched] = useState(false);

  const sourceAccount = accounts.find((a) => a._id === form.sourceAccountId);
  const destinationAccount = accounts.find((a) => a._id === form.destinationAccountId);
  // A real Account document that predates the multi-currency migration has
  // no currency field in its stored BSON at all (the API never applies the
  // schema default on a .lean() read) - default to MXN explicitly rather
  // than passing `undefined` on to the FX/amount math below.
  const sourceCurrency = sourceAccount?.currency || "MXN";
  const destinationCurrency = destinationAccount?.currency || "MXN";
  const isCrossCurrency = Boolean(sourceAccount && destinationAccount && sourceCurrency !== destinationCurrency);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "destinationAmount") setDestinationTouched(true);
    setForm((f) => ({ ...f, [name]: value }));
  };

  // Same currency: mirror the source amount by default (still editable, for
  // a transfer fee). Cross currency: fetch a live estimate as a starting
  // suggestion - the user can overwrite it with the exact bank rate.
  useEffect(() => {
    if (!sourceAccount || !destinationAccount) return;
    const numericAmount = Number(form.sourceAmount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return;

    if (!isCrossCurrency) {
      if (!destinationTouched) setForm((f) => ({ ...f, destinationAmount: f.sourceAmount }));
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setQuoting(true);
        const amountMinor = majorToMinor(numericAmount, sourceCurrency);
        const res = await toFetch.post("general-data/fx/quote", {
          amountMinor,
          fromCurrency: sourceCurrency,
          toCurrency: destinationCurrency,
        });
        if (!cancelled && res.ok && !destinationTouched) {
          setForm((f) => ({ ...f, destinationAmount: String(minorToMajor(res.data.amountMinor, destinationCurrency)) }));
        }
      } catch (e) {
        // Silently unavailable - the user can still enter it manually.
      } finally {
        if (!cancelled) setQuoting(false);
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.sourceAccountId, form.destinationAccountId, form.sourceAmount, isCrossCurrency]);

  const clearForm = () => {
    setForm(EMPTY_FORM);
    setDestinationTouched(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sourceAccount || !destinationAccount) {
      runNotify("error", "Select both a source and destination account");
      return;
    }
    if (sourceAccount._id === destinationAccount._id) {
      runNotify("error", "Source and destination accounts must be different");
      return;
    }
    const sourceAmountMinor = majorToMinor(Number(form.sourceAmount) || 0, sourceCurrency);
    const destinationAmountMinor = majorToMinor(Number(form.destinationAmount) || 0, destinationCurrency);
    if (!(sourceAmountMinor > 0) || !(destinationAmountMinor > 0)) {
      runNotify("error", "Enter both amounts");
      return;
    }

    setIsLoading(true);
    try {
      const res = await toFetch.post("general-data/transactions/transfer", {
        user: user._id,
        wallet: user.wallet,
        name: form.name,
        kind: isCrossCurrency ? "exchange" : "transfer",
        sourceAccountId: sourceAccount._id,
        sourceAmountMinor,
        destinationAccountId: destinationAccount._id,
        destinationAmountMinor,
        date: form.date,
      });
      if (res.ok) {
        runNotify("ok", res.message);
        dispatch(addNewTransacctions([res.data.outgoing, res.data.incoming]));
        clearForm();
      } else {
        runNotify("error", res.message || "Something went wrong");
      }
    } catch (err) {
      runNotify("error", String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full overflow-y-scroll relative bg-slate-50">
      <div
        className={`loader-add-trans absolute w-full h-full bg-white/90 items-center justify-center z-[100] rounded-t-2xl ${
          isLoading ? "flex" : "hidden"
        }`}
      >
        <Spin size="large" />
      </div>
      <div className="w-full h-full flex justify-center items-center">
        <form
          onSubmit={handleSubmit}
          className="form-trans-edit w-[100%] h-full flex flex-col gap-2 items-start justify-start px-10 bg-slate-50 rounded-[60px] pt-[30px] pb-20 min-[600px]:w-[500px] min-[820px]:w-[770px] min-[1200px]:w-[800px]"
        >
          <h1 className="text-xl min-[450px]:text-2xl font-light text-center w-full">
            {isCrossCurrency ? "Currency Exchange" : "Transfer Between Accounts"}
          </h1>
          <p className="label-tfp">Name (optional)</p>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder={isCrossCurrency ? "Currency exchange" : "Transfer between accounts"}
          />

          <p className="label-tfp">From account</p>
          <div className="etm-selector bg-white text-black w-full flex items-center justify-center px-[4px] py-[2px]">
            <select
              className="bg-transparent appearance-none w-full pr-4"
              name="sourceAccountId"
              value={form.sourceAccountId}
              onChange={handleChange}
            >
              <option value="">Select account</option>
              {accounts.map((acc) => (
                <option value={acc._id} key={`src-${acc._id}`}>
                  {acc.name} ({acc.currency || "MXN"})
                </option>
              ))}
            </select>
          </div>
          <p className="label-tfp">Amount ({sourceAccount ? sourceCurrency : "—"})</p>
          <input
            type="number"
            step="0.01"
            name="sourceAmount"
            value={form.sourceAmount}
            onChange={handleChange}
            placeholder="Amount"
          />

          <p className="label-tfp">To account</p>
          <div className="etm-selector bg-white text-black w-full flex items-center justify-center px-[4px] py-[2px]">
            <select
              className="bg-transparent appearance-none w-full pr-4"
              name="destinationAccountId"
              value={form.destinationAccountId}
              onChange={handleChange}
            >
              <option value="">Select account</option>
              {accounts.map((acc) => (
                <option value={acc._id} key={`dst-${acc._id}`}>
                  {acc.name} ({acc.currency || "MXN"})
                </option>
              ))}
            </select>
          </div>
          <p className="label-tfp">
            Amount received ({destinationAccount ? destinationCurrency : "—"}){" "}
            {isCrossCurrency && (
              <Tooltip title="Pre-filled from a live exchange-rate estimate - overwrite it with the exact amount your bank actually gave you.">
                <span className="text-purple-500 cursor-help">{quoting ? "estimating…" : "(estimate, editable)"}</span>
              </Tooltip>
            )}
          </p>
          <input
            type="number"
            step="0.01"
            name="destinationAmount"
            value={form.destinationAmount}
            onChange={handleChange}
            placeholder="Amount received"
          />

          <p className="label-tfp">Date</p>
          <div className="date-container w-full h-[100px]">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DemoContainer components={["MobileDateTimePicker"]}>
                <DemoItem label="">
                  <MobileDateTimePicker
                    className="text-center flex items-center justify-between border-2"
                    slotProps={{ textField: { size: "small" } }}
                    onChange={(newValue) => setForm((f) => ({ ...f, date: new Date(newValue.format()) }))}
                    value={dayjs(form.date)}
                    sx={{
                      "& .MuiInputBase-root": { width: "100%", height: "100%", padding: "0px", border: "none" },
                      "& .MuiInputBase-input": { width: "100%", height: "100%", border: "1px solid rgb(176, 23, 176)" },
                    }}
                  />
                </DemoItem>
              </DemoContainer>
            </LocalizationProvider>
          </div>

          <button
            className="w-full p-2 bg-purple-600 text-white text-center rounded-full mt-3 hover:bg-purple-500"
            type="submit"
          >
            {isLoading ? <Spin /> : isCrossCurrency ? "Exchange" : "Transfer"}
          </button>
          <div className="clearForm underline text-red-400 cursor-pointer" onClick={clearForm}>
            Clear Form
          </div>
        </form>
      </div>
    </div>
  );
}

export default TransferExchangeModal;
