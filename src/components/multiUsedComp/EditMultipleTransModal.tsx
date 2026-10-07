"use client";

import React, { useState, useEffect, useContext } from "react";
import CategoIcon from "./CategoIcon";
import "@/components/styles/animations.css";
import "@/components/multiUsedComp/css/muliUsed.css";
import dayjs, { type Dayjs } from "dayjs";
import { DemoContainer, DemoItem } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { MobileDateTimePicker } from "@mui/x-date-pickers/MobileDateTimePicker";
import { Switch, ConfigProvider, Space, Spin } from "antd";
import fetcher from "@/helpers/fetcher";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/lib/store";
import runNotify from "@/helpers/gastifyNotifier";
import { updateManyTransactions, type TransactionData } from "@/lib/features/transacctionsSlice";
import SelectCategories from "../categories/SelectCategoryProvider/SelectCategories";
import { SelectCategoryContext } from "../categories/SelectCategoryProvider/SelectCategoryProvider";
import BtnSelectCategoryContext from "../buttons/buttonWrappers/selectBtnCategoryWithContext.jsx/BtnSelectCategoryContext";
import BasicModal from "../modals/basicModal/BasicModal";
import ModalCategoryContent from "../modals/contents/selectCategory/ModalCategoryContent";
import useModal from "@/hooks/useModalBasic";
import useGetDataFromProvider from "@/hooks/getAllInfo/useGetInfoFromProvider";

const TypedBtnSelectCategoryContext = BtnSelectCategoryContext as React.ComponentType<{
  onClose?: () => void;
  [key: string]: unknown;
}>;

// Select value that means "unlink the account" (the empty value means "do not touch it").
const NO_ACCOUNT_VALUE = "__no_account__";

export interface DataProviderAccount {
  _id: string;
  name?: string;
  currency?: string;
  [key: string]: unknown;
}

export interface EditMultipleTransItem {
  _id?: string;
  [key: string]: unknown;
}

export type EditMultipleTransInput = string | EditMultipleTransItem | unknown;

export interface EditMultipleTransModalProps {
  trans?: EditMultipleTransInput[] | unknown;
  onClose?: () => void;
  hidden?: unknown;
  [key: string]: unknown;
}

export interface EditMultipleTransModalInnerProps {
  trans?: EditMultipleTransInput[] | unknown;
  onClose: () => void;
}

interface TransactionInfoState {
  transactions: unknown[];
  name: string;
  amount: string;
  isIncome: boolean;
  isBill: boolean;
  isReadable: boolean;
  date: Date | string;
  category: string;
  subCategory: string;
  tags: string;
  account: string | null;
}

interface CategorySelectedItem {
  _id?: string;
  fatherCategory?: { _id?: string; [key: string]: unknown } | string | null;
  [key: string]: unknown;
}

interface EditManyResponse {
  data?: TransactionData[];
  message?: string;
  [key: string]: unknown;
}

function EditMultipleTransModalInner({ trans, onClose }: EditMultipleTransModalInnerProps): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const toFetch = fetcher();
  const dispatch = useDispatch<AppDispatch>();
  const { close, handleClose } = useModal();
  const { handleClean } = useContext(SelectCategoryContext);
  const { accounts } = useGetDataFromProvider() as {
    accounts?: DataProviderAccount[];
    [key: string]: unknown;
  };

  const [typeTouched, setTypeTouched] = useState(false);
  const [readableTouched, setReadableTouched] = useState(false);

  const [transactionInfo, setTransactionInfo] = useState<TransactionInfoState>({
    transactions: [],
    name: "",
    amount: "",
    isIncome: false,
    isBill: false,
    isReadable: false,
    date: "",
    category: "",
    subCategory: "",
    tags: "",
    account: "",
  });

  useEffect(() => {
    if (trans) {
      setTransactionInfo((prev) => ({ ...prev, transactions: trans as unknown[] }));
    }
  }, [trans]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setTransactionInfo((prev) => ({ ...prev, [name]: value }));
  };

  const onChangeSwitch = (checked: boolean, typeBoolean: string): void => {
    if (typeBoolean === "income") {
      setTypeTouched(true);
      setTransactionInfo((prev) => ({ ...prev, isIncome: checked, isBill: !checked }));
    } else if (typeBoolean === "bill") {
      setTypeTouched(true);
      setTransactionInfo((prev) => ({ ...prev, isBill: checked, isIncome: !checked }));
    } else if (typeBoolean === "readable") {
      setReadableTouched(true);
      setTransactionInfo((prev) => ({ ...prev, isReadable: checked }));
    }
  };

  const handleCategory = (cat: unknown): void => {
    if (!cat) return;
    const categoryItem = cat as CategorySelectedItem;
    const fatherId = categoryItem?.fatherCategory
      ? typeof categoryItem.fatherCategory === "object"
        ? (categoryItem.fatherCategory as { _id?: string })?._id
        : categoryItem.fatherCategory
      : null;
    if (fatherId) {
      setTransactionInfo((prev) => ({
        ...prev,
        subCategory: categoryItem._id || "",
        category: fatherId as string,
      }));
    } else {
      setTransactionInfo((prev) => ({
        ...prev,
        category: categoryItem._id || "",
        subCategory: "",
      }));
    }
  };

  const handleDefAccount = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setTransactionInfo((prev) => ({
      ...prev,
      account: e.target.value === NO_ACCOUNT_VALUE ? null : e.target.value,
    }));
  };

  const hanleDatePickerChange = (newDate: string): void => {
    setTransactionInfo((prev) => ({ ...prev, date: new Date(newDate) }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    const tagsArr = transactionInfo.tags
      ? transactionInfo.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const fields: string[] = [];
    if (transactionInfo.name.trim()) fields.push("name");
    if (transactionInfo.amount !== "") fields.push("amount");
    if (typeTouched) { fields.push("isIncome"); fields.push("isBill"); }
    if (readableTouched) fields.push("isReadable");
    if (transactionInfo.date) fields.push("date");
    if (transactionInfo.category || transactionInfo.subCategory) { fields.push("category"); fields.push("subCategory"); }
    if (tagsArr.length > 0) fields.push("tags");
    // "" = leave the account as it is; null = unlink it from every selected movement.
    if (transactionInfo.account !== "") fields.push("account");

    const payload = {
      ...transactionInfo,
      name: transactionInfo.name.trim(),
      tags: tagsArr,
      fields,
    };
    try {
      const response = (await toFetch.post(
        "general-data/transactions/edit-many",
        payload
      )) as EditManyResponse;
      if (response.data) {
        runNotify("ok", response.message || "");
        dispatch(updateManyTransactions(response.data));
        handleClean();
        onClose();
      } else {
        runNotify("error", response.message || "Something went wrong");
      }
    } catch (err) {
      runNotify("error", String(err));
      handleClean();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full z-[10000] bg-black/50 backdrop-blur-md flex items-center justify-center">
      <div className="content gf-glass-violet flex flex-col w-full max-w-[500px] max-h-[90vh] relative rounded-2xl items-center justify-center pt-[40px] overflow-hidden">
        {isLoading && (
          <div className="absolute top-0 left-0 bg-gf-surface/70 flex justify-center items-center w-full h-full z-[10001]">
            <Spin size="large" />
          </div>
        )}

        <h1 className="text-center py-[10px] text-2xl text-white">
          Edit {Array.isArray(trans) ? trans.length : 0} Transactions 🪄
        </h1>
        <div className="w-full px-4 pb-2">
          <div className="bg-yellow-500/15 border border-yellow-300 text-yellow-800 text-[11px] rounded-xl px-3 py-2 text-center leading-relaxed">
            ⚠️ Everything you fill in here will overwrite <b>all {Array.isArray(trans) ? trans.length : 0} selected transactions</b>. Fields you leave blank will keep their original values.
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="form-trans-edit w-full h-full flex flex-col gap-2 items-start justify-start px-10 rounded-t-[60px] pt-[30px] pb-20 overflow-y-scroll"
        >
          <p className="label-tfp">Name</p>
          <input
            type="text"
            name="name"
            value={transactionInfo.name}
            onChange={handleChange}
            placeholder="Leave blank to keep original"
          />

          <p className="label-tfp">Amount</p>
          <input
            type="number"
            name="amount"
            value={transactionInfo.amount}
            onChange={handleChange}
            placeholder="Leave blank to keep original"
          />

          <div className="switchers-cont flex gap-3">
            <ConfigProvider
              theme={{
                token: { colorPrimary: "#9700FF", borderRadius: 2, colorBgContainer: "#9700FF" },
              }}
            >
              <Space direction={"" as "horizontal"} size={12}>
                <div className="switch-int-cont">
                  <p className="label-tfp">Is Income:</p>
                  <Switch onChange={(v) => onChangeSwitch(v, "income")} value={transactionInfo.isIncome} />
                </div>
                <div className="switch-int-cont">
                  <p className="label-tfp">Is Bill:</p>
                  <Switch onChange={(v) => onChangeSwitch(v, "bill")} value={transactionInfo.isBill} />
                </div>
                <div className="switch-int-cont">
                  <p className="label-tfp">Is Readable:</p>
                  <Switch onChange={(v) => onChangeSwitch(v, "readable")} value={transactionInfo.isReadable} />
                </div>
              </Space>
            </ConfigProvider>
          </div>

          <p className="label-tfp">Date</p>
          <div className="date-container w-full h-[100px]">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DemoContainer components={["MobileDateTimePicker"]}>
                <DemoItem label="">
                  <MobileDateTimePicker
                    slotProps={{
                      textField: { size: "small" },
                      dialog: { sx: { zIndex: 35000 } },
                      mobilePaper: { sx: { zIndex: 35000 } },
                    }}
                    onChange={(v: Dayjs | null) => {
                      if (v && typeof v.format === "function") {
                        hanleDatePickerChange(v.format());
                      }
                    }}
                    value={transactionInfo.date ? dayjs(transactionInfo.date) : null}
                    sx={{
                      "& .MuiInputBase-root": { width: "100%", height: "100%", padding: "0px", border: "none" },
                      "& .MuiInputBase-input": { width: "100%", height: "100%", border: "none" },
                    }}
                  />
                </DemoItem>
              </DemoContainer>
            </LocalizationProvider>
          </div>

          <p className="label-tfp">Category</p>
          <TypedBtnSelectCategoryContext onClose={handleClose} />
          {close && (
            <BasicModal
              close={handleClose}
              zIndexClass="z-[20000]"
              renderContent={
                <ModalCategoryContent close={handleClose} getSelected={handleCategory} />
              }
            />
          )}

          <p className="label-tfp">Tags</p>
          <input
            type="text"
            name="tags"
            value={transactionInfo.tags}
            onChange={handleChange}
            placeholder="Tags (separated by comma)"
          />

          <p className="label-tfp">Account</p>
          <div className="etm-selector bg-gf-surface text-gf-text w-full flex items-center justify-center px-[4px] py-[2px]">
            <select
              className="bg-transparent appearance-none w-full pr-4"
              value={transactionInfo.account === null ? NO_ACCOUNT_VALUE : transactionInfo.account}
              onChange={handleDefAccount}
            >
              <option value="">Keep current account</option>
              <option value={NO_ACCOUNT_VALUE}>No account</option>
              {accounts?.map((acc) => (
                <option value={acc._id} key={acc._id}>{acc.name}</option>
              ))}
            </select>
          </div>

          <button
            className="w-full p-2 gf-glass-button text-white text-center rounded-full mt-3"
            type="submit"
          >
            {isLoading ? <Spin /> : "Save changes"}
          </button>
        </form>

        <button onClick={onClose} className="close-con absolute top-0 right-0 rounded-full gf-glass-card p-1.5 text-purple-100 hover:text-white transition-colors m-2 pulse-animation-short">
          <CategoIcon type={"MdClose"} siz={20} />
        </button>
      </div>
    </div>
  );
}

function EditMultipleTransModal({ trans, onClose }: EditMultipleTransModalProps): React.JSX.Element | null {
  const [active, setActive] = useState(false);
  if (active) return null;
  const handleClose = (): void => {
    setActive(true);
    onClose?.();
  };
  return (
    <SelectCategories>
      <EditMultipleTransModalInner trans={trans} onClose={handleClose} />
    </SelectCategories>
  );
}

export default EditMultipleTransModal;
