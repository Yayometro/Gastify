"use client";

import React, { useEffect, useState } from "react";
import { PiMicrosoftExcelLogoFill } from "react-icons/pi";
import { BsFiletypeXml } from "react-icons/bs";
import { Button, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import fetcher from "@/helpers/fetcher";
import { useSelector, useDispatch } from "react-redux";
import runNotify from "@/helpers/gastifyNotifier";
import { addNewTransacctions, removeManyTransactions } from "@/lib/features/transacctionsSlice";
import { fetchTrans } from "@/lib/features/transacctionsSlice";
import DedupPreviewModal from "@/components/multiUsedComp/DedupPreviewModal";
import { MdFormatAlignLeft, MdOutlineCleaningServices } from "react-icons/md";
import { fetchUser } from "@/lib/features/userSlice";
import useGetUserSession from "@/hooks/useGetUserSession";

const STATUS = {
  idle: null,
  uploading: { label: "Uploading file...", color: "text-purple-500", spin: true },
  processing: { label: "Reading and creating transactions...", color: "text-purple-500", spin: true },
  done: { label: "Done!", color: "text-green-600", spin: false },
  error: { label: "Something went wrong", color: "text-red-500", spin: false },
};

function SpinnerIcon() {
  return (
    <svg className="animate-spin h-4 w-4 inline-block mr-1" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function StatusBadge({ status }) {
  const s = STATUS[status];
  if (!s) return null;
  return (
    <p className={`text-xs flex items-center gap-1 ${s.color} transition-all`}>
      {s.spin && <SpinnerIcon />}
      {s.label}
    </p>
  );
}

function ReadFileComp({}) {
  const [isExcel, setIsExcel] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [showDedup, setShowDedup] = useState(false);
  const [dedupLoading, setDedupLoading] = useState(false);
  const [dedupResult, setDedupResult] = useState(null);
  const [dedupDeleteAll, setDedupDeleteAll] = useState(false);
  const [dedupPreview, setDedupPreview] = useState(null);
  const [dedupConfirming, setDedupConfirming] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  let { email } = useGetUserSession();
  const toFetch = fetcher();
  const reduxDispatch = useDispatch();
  const ccUser = useSelector((state) => state.userReducer.data);

  useEffect(() => {
    if (ccUser.status == "idle") {
      reduxDispatch(fetchUser(email));
    }
  }, [ccUser, email]);

  const handleDownloadTemplate = async () => {
    const userEmail = ccUser.mail || email;
    if (!userEmail) return;
    try {
      setIsDownloading(true);
      const response = await fetch(
        toFetch.getFullPath(`general-data/files/template/${userEmail}`)
      );
      if (!response.ok) throw new Error("Template generation failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "gastify-template.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      runNotify("error", "Could not download template, please try again 🤕");
    } finally {
      setIsDownloading(false);
    }
  };

  const customRequest = async ({ file, onSuccess, onError }) => {
    const userEmail = ccUser.mail || email;
    if (!userEmail) {
      onError(new Error("User not available yet, please try again"));
      return;
    }
    setUploadStatus("uploading");
    const formData = new FormData();
    formData.append("file", file);
    try {
      setUploadStatus("processing");
      const response = await fetch(
        toFetch.getFullPath(`general-data/files/upload/${userEmail}`),
        { method: "POST", body: formData }
      );
      const res = await response.json();
      onSuccess(res);
    } catch (e) {
      setUploadStatus("error");
      onError(e);
    }
  };

  const uploadProps = {
    name: "file",
    customRequest,
    showUploadList: false,
    onChange(info) {
      if (info.file.status === "done") {
        const res = info.file.response;
        if (!res?.ok) {
          setUploadStatus("error");
          if (res?.versionMismatch) {
            runNotify("error", `Your template is outdated. Please click "Download format" to get the latest template and try again 📥`);
          } else {
            runNotify("error", res?.message || "Something went wrong, please try again 🤕");
          }
          return;
        }
        setUploadStatus("done");
        const created = res.data?.length ?? 0;
        runNotify("ok", `${created} transactions have been processed and created from the file 😎`);
        if (created > 0) reduxDispatch(addNewTransacctions(res.data));
        setUploadResult({ count: created });
        setTimeout(() => setUploadStatus("idle"), 3000);
      } else if (info.file.status === "error") {
        setUploadStatus("error");
        const errMsg = info.file.response?.message || info.file.error?.message || "The file couldn't be processed, please try again 🤕";
        runNotify("error", errMsg);
        setTimeout(() => setUploadStatus("idle"), 3000);
      }
    },
  };

  const dedupRequest = async ({ file, onSuccess, onError }) => {
    const userEmail = ccUser.mail || email;
    if (!userEmail) {
      onError(new Error("User not available yet, please try again"));
      return;
    }
    setDedupLoading(true);
    setDedupResult(null);
    setDedupPreview(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("deleteAll", dedupDeleteAll ? "true" : "false");
    formData.append("preview", "true");
    try {
      const response = await fetch(
        toFetch.getFullPath(`general-data/files/deduplicate/${userEmail}`),
        { method: "POST", body: formData }
      );
      const res = await response.json();
      onSuccess(res);
    } catch (e) {
      onError(e);
    } finally {
      setDedupLoading(false);
    }
  };

  const dedupProps = {
    name: "file",
    customRequest: dedupRequest,
    showUploadList: false,
    onChange(info) {
      if (info.file.status === "done") {
        const res = info.file.response;
        if (!res?.ok) {
          runNotify("error", res?.message || "Could not process deduplication 🤕");
          return;
        }
        // Show preview modal — user must confirm before deleting
        setDedupPreview(res);
      } else if (info.file.status === "error") {
        runNotify("error", "Deduplication failed, please try again 🤕");
        setDedupLoading(false);
      }
    },
  };

  const handleDedupConfirm = async (idsToDelete) => {
    if (!idsToDelete?.length) {
      setDedupPreview(null);
      return;
    }
    setDedupConfirming(true);
    try {
      const res = await toFetch.post("general-data/transactions/remove-many", { manyTrans: idsToDelete });
      if (res?.ok !== false) {
        reduxDispatch(removeManyTransactions(idsToDelete));
        setDedupResult({ removed: idsToDelete.length, scanned: dedupPreview.scanned });
        runNotify("ok", `Removed ${idsToDelete.length} duplicate transaction(s) 🧹`);
      } else {
        runNotify("error", res?.message || "Could not delete transactions 🤕");
      }
    } catch (e) {
      runNotify("error", "Could not delete transactions 🤕");
    } finally {
      setDedupConfirming(false);
      setDedupPreview(null);
    }
  };

  const isUploading = uploadStatus === "uploading" || uploadStatus === "processing";

  return (
    <div className="bg-slate-50 py-8 my-2 px-[30px] rounded-[60px] w-full max-w-[900px] flex flex-col gap-4">

      {/* ── Description ── */}
      <div className="text-center">
        <h1 className="text-2xl font-light">Import from Excel</h1>
        <p className="text-xs text-slate-400 mt-1 max-w-[300px] mx-auto leading-relaxed">
          Download the Gastify template, fill it with your transactions (date, concept, amount, type) and upload it here. Categories and tags are auto-resolved from your existing ones.
        </p>
      </div>

      {/* ── Upload section ── */}
      <div className="flex flex-col items-center gap-2">
        <div
          className="flex items-center gap-2 text-purple-500 hover:text-purple-400 w-fit cursor-pointer text-sm"
          onClick={() => setIsExcel(!isExcel)}
        >
          <p>{isExcel ? "Excel file" : "XML file"}</p>
          {isExcel ? <PiMicrosoftExcelLogoFill size={18} /> : <BsFiletypeXml size={18} />}
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <Upload {...uploadProps} disabled={isUploading}>
            <Button
              icon={<UploadOutlined />}
              loading={isUploading}
              disabled={isUploading}
              className="!bg-purple-600 !border-purple-600 !text-white hover:!bg-purple-500 hover:!border-purple-500"
            >
              {isUploading ? "Processing..." : "Upload file"}
            </Button>
          </Upload>
        </div>

        <StatusBadge status={uploadStatus} />

        {uploadResult && (
          <div className="flex items-start gap-2 bg-green-50 text-green-700 text-xs px-4 py-2 rounded-xl w-full">
            <div className="flex-1 text-center">
              <p className="font-semibold">
                {uploadResult.count > 0
                  ? `${uploadResult.count} transaction${uploadResult.count !== 1 ? "s" : ""} imported successfully`
                  : "File processed — no new transactions found"}
              </p>
              <p className="text-green-500 mt-[2px]">Ready to use in your dashboard</p>
            </div>
            <button
              onClick={() => setUploadResult(null)}
              className="text-green-400 hover:text-green-600 text-base leading-none shrink-0 mt-[1px]"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        <div
          className="flex items-center gap-1 cursor-pointer text-purple-400 hover:text-purple-300 hover:underline text-xs"
          onClick={handleDownloadTemplate}
        >
          <MdFormatAlignLeft size={16} />
          <span>{isDownloading ? "Generating template..." : "Download format"}</span>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="border-t border-slate-200 w-full" />

      {/* ── Remove Duplicates section ── */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={() => { setShowDedup(!showDedup); setDedupResult(null); setDedupPreview(null); }}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-purple-500 transition-colors cursor-pointer"
        >
          <MdOutlineCleaningServices size={18} />
          <span>{showDedup ? "Hide" : "Remove duplicates from Excel"}</span>
        </button>

        {showDedup && (
          <div className="flex flex-col items-center gap-3 w-full">
            <p className="text-xs text-slate-400 text-center max-w-[280px] leading-relaxed">
              Upload the same Excel you already imported. Transactions that share the exact <b>date</b>, <b>name</b> and <b>amount</b> will be processed according to the mode below.
            </p>

            {/* Toggle delete mode */}
            <div className="flex items-center gap-2 bg-slate-100 rounded-full p-1 text-xs select-none">
              <button
                onClick={() => setDedupDeleteAll(false)}
                className={`px-3 py-1 rounded-full transition-colors ${
                  !dedupDeleteAll
                    ? "bg-white text-purple-600 font-medium shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Keep one original
              </button>
              <button
                onClick={() => setDedupDeleteAll(true)}
                className={`px-3 py-1 rounded-full transition-colors ${
                  dedupDeleteAll
                    ? "bg-white text-red-600 font-medium shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Delete all matches
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center max-w-[260px] -mt-1 leading-relaxed">
              {dedupDeleteAll
                ? "Every transaction matching a row in the file will be deleted — nothing is kept."
                : "One record is always kept per group — only the extra copies are removed."}
            </p>

            <div onClick={(e) => e.stopPropagation()}>
              <Upload {...dedupProps}>
                <Button
                  icon={<MdOutlineCleaningServices size={14} />}
                  loading={dedupLoading}
                  className={`text-xs ${dedupDeleteAll ? "!border-red-400 !text-red-600 hover:!border-red-500" : ""}`}
                >
                  {dedupLoading ? "Scanning for duplicates..." : "Upload & Clean"}
                </Button>
              </Upload>
            </div>

            {dedupResult && (
              <div className={`flex items-start gap-2 text-xs px-4 py-2 rounded-xl w-full ${dedupResult.removed > 0 ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                <div className="flex-1 text-center">
                  {dedupResult.removed > 0 ? (
                    <>
                      <p className="font-semibold">Removed {dedupResult.removed} duplicate{dedupResult.removed > 1 ? "s" : ""}</p>
                      <p className={dedupResult.removed > 0 ? "text-green-500" : ""}>{dedupResult.scanned} rows scanned</p>
                    </>
                  ) : (
                    <p>No duplicates found in {dedupResult.scanned} rows</p>
                  )}
                </div>
                <button
                  onClick={() => setDedupResult(null)}
                  className={`text-base leading-none shrink-0 mt-[1px] ${dedupResult.removed > 0 ? "text-green-400 hover:text-green-600" : "text-slate-400 hover:text-slate-600"}`}
                  aria-label="Dismiss"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {dedupPreview && (
        <DedupPreviewModal
          preview={dedupPreview}
          deleteAll={dedupDeleteAll}
          onConfirm={handleDedupConfirm}
          onCancel={() => setDedupPreview(null)}
          confirming={dedupConfirming}
        />
      )}
    </div>
  );
}

export default ReadFileComp;
