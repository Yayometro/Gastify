"use client";

import React, { useState, useContext } from "react";
import { Modal, Switch, ConfigProvider, Space } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { DemoContainer, DemoItem } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { MobileDateTimePicker } from "@mui/x-date-pickers/MobileDateTimePicker";
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

export interface FieldMetaItem {
  label: string;
  description: string;
}

export const FIELD_META: Record<string, FieldMetaItem> = {
  name:     { label: "Rename",        description: "Change the name for all selected transactions." },
  date:     { label: "Change date",   description: "Set a new date for all selected transactions." },
  type:     { label: "Change type",   description: "Set Bill or Income for all selected transactions." },
  category: { label: "Change category", description: "Assign a category (and subcategory) to all selected transactions." },
  account:  { label: "Change account", description: "Assign an account to all selected transactions." },
  tags:     { label: "Change tags",    description: "Set tags (separated by comma) for all selected transactions." },
};

export type QuickEditField = "name" | "date" | "type" | "category" | "account" | "tags" | string;

export interface DataProviderAccount {
  _id: string;
  name?: string;
  currency?: string;
  [key: string]: unknown;
}

export interface CategorySelectedItem {
  _id?: string;
  fatherCategory?: { _id?: string; [key: string]: unknown } | string | null;
  [key: string]: unknown;
}

export interface QuickEditState {
  name: string;
  date: Date;
  isIncome: boolean;
  isBill: boolean;
  category: string;
  subCategory: string;
  account: string | null;
  tags: string;
}

interface EditManyResponse {
  data?: TransactionData[];
  message?: string;
  [key: string]: unknown;
}

export interface QuickEditInnerProps {
  field: QuickEditField;
  transIds: (string | unknown)[];
  onClose: () => void;
}

export interface QuickEditModalProps {
  field?: QuickEditField | null;
  transIds?: (string | unknown)[];
  onClose: () => void;
}

function QuickEditInner({ field, transIds, onClose }: QuickEditInnerProps): React.JSX.Element {
  const toFetch = fetcher();
  const dispatch = useDispatch<AppDispatch>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { close, handleClose } = useModal();
  const { handleClean } = useContext(SelectCategoryContext);
  const { accounts } = useGetDataFromProvider() as {
    accounts?: DataProviderAccount[];
    [key: string]: unknown;
  };

  const [value, setValue] = useState<QuickEditState>({
    name: "",
    date: new Date(),
    isIncome: false,
    isBill: true,
    category: "",
    subCategory: "",
    account: "",
    tags: "",
  });

  const handleCategory = (cat?: CategorySelectedItem | null) => {
    if (!cat) return;
    const fatherId = cat?.fatherCategory
      ? (typeof cat.fatherCategory === "object" ? cat.fatherCategory?._id : cat.fatherCategory)
      : null;
    if (fatherId) {
      setValue((v) => ({ ...v, subCategory: cat._id || "", category: fatherId }));
    } else {
      setValue((v) => ({ ...v, category: cat._id || "", subCategory: "" }));
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    let payload: Record<string, unknown> = { transactions: transIds };

    if (field === "name") {
      if (!value.name.trim()) { runNotify("error", "Name cannot be empty"); setIsLoading(false); return; }
      payload = { ...payload, fields: ["name"], name: value.name.trim() };
    } else if (field === "date") {
      payload = { ...payload, fields: ["date"], date: value.date };
    } else if (field === "type") {
      payload = { ...payload, fields: ["isIncome", "isBill"], isIncome: value.isIncome, isBill: value.isBill };
    } else if (field === "category") {
      payload = { ...payload, fields: ["category", "subCategory"], category: value.category, subCategory: value.subCategory || null };
    } else if (field === "account") {
      payload = { ...payload, fields: ["account"], account: value.account || null };
    } else if (field === "tags") {
      const tagsArr = typeof value.tags === "string"
        ? value.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : (value.tags || []);
      payload = { ...payload, fields: ["tags"], tags: tagsArr };
    }

    try {
      const response = (await toFetch.post("general-data/transactions/edit-many", payload)) as EditManyResponse;
      if (response.data) {
        runNotify("ok", response.message);
        dispatch(updateManyTransactions(response.data));
        if (field === "category" && handleClean) handleClean();
        setIsLoading(false); // set before unmount to avoid setState-on-unmounted warning
        onClose();
      } else {
        runNotify("error", response.message || "Something went wrong");
        setIsLoading(false);
      }
    } catch (e) {
      runNotify("error", String(e));
      setIsLoading(false);
    }
  };

  const meta = FIELD_META[field];

  const renderInput = (): React.ReactNode => {
    if (field === "name") return (
      <input
        autoFocus
        type="text"
        value={value.name}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue((v) => ({ ...v, name: e.target.value }))}
        placeholder="New name for all selected transactions"
        className="w-full border border-gf-border rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-400"
      />
    );

    if (field === "date") return (
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DemoContainer components={["MobileDateTimePicker"]}>
          <DemoItem label="">
            <MobileDateTimePicker
              slotProps={{
                textField: { size: "small" },
                dialog: { sx: { zIndex: 35000 } },
                mobilePaper: { sx: { zIndex: 35000 } },
              }}
              value={dayjs(value.date)}
              onChange={(v: Dayjs | null) => {
                if (v) {
                  setValue((prev) => ({ ...prev, date: new Date(v.format()) }));
                }
              }}
              sx={{
                "& .MuiInputBase-root": { width: "100%", padding: "0px", border: "none", borderRadius: "12px" },
                "& .MuiInputBase-input": { border: "1px solid rgb(176,23,176)", borderRadius: "12px", padding: "8px 12px" },
                "& .MuiOutlinedInput-notchedOutline": { borderRadius: "12px" },
              }}
            />
          </DemoItem>
        </DemoContainer>
      </LocalizationProvider>
    );

    if (field === "type") return (
      <ConfigProvider theme={{ token: { colorPrimary: "#9700FF", colorBgContainer: "#9700FF" } }}>
        <Space direction="vertical" size={12} className="w-full">
          <div className="flex items-center gap-3">
            <Switch
              checked={value.isIncome}
              onChange={(checked: boolean) => setValue((v) => ({ ...v, isIncome: checked, isBill: !checked }))}
            />
            <span className="text-sm text-gf-text-muted">Income</span>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={value.isBill}
              onChange={(checked: boolean) => setValue((v) => ({ ...v, isBill: checked, isIncome: !checked }))}
            />
            <span className="text-sm text-gf-text-muted">Bill / Expense</span>
          </div>
        </Space>
      </ConfigProvider>
    );

    if (field === "category") return (
      <SelectCategories>
        <div className="flex flex-col gap-2">
          <TypedBtnSelectCategoryContext onClose={handleClose} />
        </div>
        {close && (
          <BasicModal
            close={handleClose}
            zIndexClass="z-[50000]"
            renderContent={
              <ModalCategoryContent close={handleClose} getSelected={handleCategory} />
            }
          />
        )}
      </SelectCategories>
    );

    if (field === "account") return (
      <select
        className="w-full border border-gf-border rounded-xl px-3 py-2 text-sm bg-gf-surface outline-none focus:border-purple-400"
        value={value.account || ""}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setValue((v) => ({ ...v, account: e.target.value || null }))}
      >
        <option value="">No account</option>
        {accounts?.map((acc) => (
          <option key={acc._id} value={acc._id}>{acc.name}</option>
        ))}
      </select>
    );

    if (field === "tags") return (
      <input
        autoFocus
        type="text"
        value={value.tags || ""}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue((v) => ({ ...v, tags: e.target.value }))}
        placeholder="Tags separated by comma (e.g. food, vacation, monthly)"
        className="w-full border border-gf-border rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-400"
      />
    );

    return null;
  };

  return (
    <Modal
      className="gf-antd-modal-glass"
      open
      zIndex={10000}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={isLoading}
      okText="Apply to all"
      cancelText="Cancel"
      okButtonProps={{
        className: isLoading
          ? "!bg-purple-300 !border-purple-300 !text-white/70 cursor-not-allowed"
          : "gf-glass-button !border-0 !text-white",
      }}
      cancelButtonProps={{ className: "gf-glass-button-neutral !border-0 !text-gf-text" }}
      title={
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-semibold">{meta?.label}</span>
          <span className="text-xs font-normal text-gf-text-muted">
            Affects {transIds.length} transaction{transIds.length !== 1 ? "s" : ""} — only this field will change, everything else stays the same.
          </span>
        </div>
      }
    >
      <div className="py-3">
        {renderInput()}
      </div>
    </Modal>
  );
}

function QuickEditModal({ field, transIds, onClose }: QuickEditModalProps): React.JSX.Element | null {
  if (!field || !transIds?.length) return null;
  return (
    <SelectCategories>
      <QuickEditInner field={field} transIds={transIds} onClose={onClose} />
    </SelectCategories>
  );
}

export default QuickEditModal;
