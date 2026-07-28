"use client";

import React, { useState, useContext } from "react";
import { Modal, Switch, ConfigProvider, Space, Spin } from "antd";
import dayjs from "dayjs";
import { DemoContainer, DemoItem } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { MobileDateTimePicker } from "@mui/x-date-pickers/MobileDateTimePicker";
import fetcher from "@/helpers/fetcher";
import { useDispatch } from "react-redux";
import runNotify from "@/helpers/gastifyNotifier";
import { updateManyTransactions } from "@/lib/features/transacctionsSlice";
import SelectCategories from "../categories/SelectCategoryProvider/SelectCategories";
import { SelectCategoryContext } from "../categories/SelectCategoryProvider/SelectCategoryProvider";
import BtnSelectCategoryContext from "../buttons/buttonWrappers/selectBtnCategoryWithContext.jsx/BtnSelectCategoryContext";
import BasicModal from "../modals/basicModal/BasicModal";
import ModalCategoryContent from "../modals/contents/selectCategory/ModalCategoryContent";
import useModal from "@/hooks/useModalBasic";
import useGetDataFromProvider from "@/hooks/getAllInfo/useGetInfoFromProvider";

const FIELD_META = {
  name:     { label: "Rename",        description: "Change the name for all selected transactions." },
  date:     { label: "Change date",   description: "Set a new date for all selected transactions." },
  type:     { label: "Change type",   description: "Set Bill or Income for all selected transactions." },
  category: { label: "Change category", description: "Assign a category (and subcategory) to all selected transactions." },
  account:  { label: "Change account", description: "Assign an account to all selected transactions." },
};

function QuickEditInner({ field, transIds, onClose }) {
  const toFetch = fetcher();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const { close, handleClose } = useModal();
  const { handleClean } = useContext(SelectCategoryContext);
  const { accounts } = useGetDataFromProvider();

  const [value, setValue] = useState({
    name: "",
    date: new Date(),
    isIncome: false,
    isBill: true,
    category: "",
    subCategory: "",
    account: "",
  });

  const handleCategory = (cat) => {
    if (!cat) return;
    const fatherId = cat?.fatherCategory
      ? (typeof cat.fatherCategory === "object" ? cat.fatherCategory?._id : cat.fatherCategory)
      : null;
    if (fatherId) {
      setValue((v) => ({ ...v, subCategory: cat._id, category: fatherId }));
    } else {
      setValue((v) => ({ ...v, category: cat._id, subCategory: "" }));
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    let payload = { transactions: transIds };

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
    }

    try {
      const response = await toFetch.post("general-data/transactions/edit-many", payload);
      if (response.data) {
        runNotify("ok", response.message);
        dispatch(updateManyTransactions(response.data));
        if (field === "category") handleClean();
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

  const renderInput = () => {
    if (field === "name") return (
      <input
        autoFocus
        type="text"
        value={value.name}
        onChange={(e) => setValue((v) => ({ ...v, name: e.target.value }))}
        placeholder="New name for all selected transactions"
        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-400"
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
              onChange={(v) => setValue((prev) => ({ ...prev, date: new Date(v.format()) }))}
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
              onChange={(checked) => setValue((v) => ({ ...v, isIncome: checked, isBill: !checked }))}
            />
            <span className="text-sm text-slate-600">Income</span>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={value.isBill}
              onChange={(checked) => setValue((v) => ({ ...v, isBill: checked, isIncome: !checked }))}
            />
            <span className="text-sm text-slate-600">Bill / Expense</span>
          </div>
        </Space>
      </ConfigProvider>
    );

    if (field === "category") return (
      <div className="w-full">
        <BtnSelectCategoryContext onClose={handleClose} />
        {close && (
          <BasicModal
            close={handleClose}
            zIndexClass="z-[20000]"
            renderContent={<ModalCategoryContent close={handleClose} getSelected={handleCategory} />}
          />
        )}
      </div>
    );

    if (field === "account") return (
      <select
        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-purple-400"
        value={value.account || ""}
        onChange={(e) => setValue((v) => ({ ...v, account: e.target.value || null }))}
      >
        <option value="">No account</option>
        {accounts?.map((acc) => (
          <option key={acc._id} value={acc._id}>{acc.name}</option>
        ))}
      </select>
    );
  };

  return (
    <Modal
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
          : "!bg-purple-600 !border-purple-600 !text-white hover:!bg-purple-500",
      }}
      title={
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-semibold">{meta?.label}</span>
          <span className="text-xs font-normal text-slate-400">
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

function QuickEditModal({ field, transIds, onClose }) {
  if (!field || !transIds?.length) return null;
  return (
    <SelectCategories>
      <QuickEditInner field={field} transIds={transIds} onClose={onClose} />
    </SelectCategories>
  );
}

export default QuickEditModal;
