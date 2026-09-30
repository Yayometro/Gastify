"use client";

import React, { useEffect, useState } from "react";
import { PiMicrosoftExcelLogoFill } from "react-icons/pi";
import { BsFiletypeXml } from "react-icons/bs";
import { Button, Upload } from "antd";
import type { UploadProps } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import fetcher from "@/helpers/fetcher";
import { useSelector, useDispatch } from "react-redux";
import runNotify from "@/helpers/gastifyNotifier";
import {
  addNewTransacctions,
  removeManyTransactions,
  updateManyTransactions,
  type TransactionData,
} from "@/lib/features/transacctionsSlice";
import DedupPreviewModal from "@/components/multiUsedComp/DedupPreviewModal";
import CategorySuggestionsModal from "@/components/multiUsedComp/CategorySuggestionsModal";
import { MdFormatAlignLeft, MdOutlineCleaningServices } from "react-icons/md";
import { fetchUser, type UserData } from "@/lib/features/userSlice";
import useGetUserSession from "@/hooks/useGetUserSession";
import type { AppDispatch, RootState } from "@/lib/store";

export type UploadStatusKey = "idle" | "uploading" | "processing" | "done" | "error";

interface StatusBadgeInfo {
  label: string;
  color: string;
  spin: boolean;
}

const STATUS: Record<UploadStatusKey, StatusBadgeInfo | null> = {
  idle: null,
  uploading: { label: "Uploading file...", color: "text-purple-500", spin: true },
  processing: { label: "Reading and creating transactions...", color: "text-purple-500", spin: true },
  done: { label: "Done!", color: "text-green-400", spin: false },
  error: { label: "Something went wrong", color: "text-red-500", spin: false },
};

function SpinnerIcon(): React.JSX.Element {
  return (
    <svg className="animate-spin h-4 w-4 inline-block mr-1" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function StatusBadge({ status }: { status: UploadStatusKey }): React.JSX.Element | null {
  const s = STATUS[status];
  if (!s) return null;
  return (
    <p className={`text-xs flex items-center gap-1 ${s.color} transition-all`}>
      {s.spin && <SpinnerIcon />}
      {s.label}
    </p>
  );
}

export interface DedupResult {
  removed: number;
  scanned?: number;
}

export interface DedupPreviewData {
  ok?: boolean;
  toDelete?: (TransactionData & { _match?: unknown })[];
  toKeep?: TransactionData[];
  scanned?: number;
  message?: string;
  [key: string]: unknown;
}

export interface UploadResult {
  count: number;
}

export interface CategorySuggestionItem {
  transaction: TransactionData & { _id: string };
  category?: { _id?: string; name?: string; color?: string; icon?: string } | null;
  subCategory?: { _id?: string; name?: string; color?: string; icon?: string } | null;
  confidence?: string;
  [key: string]: unknown;
}

export interface SuggestionApplication {
  transactionId: string;
  categoryId?: string;
  subCategoryId?: string;
}

interface UploadApiResponse {
  ok?: boolean;
  versionMismatch?: boolean;
  message?: string;
  data?: TransactionData[];
  [key: string]: unknown;
}


export interface ReadFileCompProps {
  [key: string]: never;
}

function ReadFileComp({}: ReadFileCompProps = {}): React.JSX.Element {
  const [isExcel, setIsExcel] = useState<boolean>(true);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatusKey>("idle");
  const [showDedup, setShowDedup] = useState<boolean>(false);
  const [dedupLoading, setDedupLoading] = useState<boolean>(false);
  const [dedupResult, setDedupResult] = useState<DedupResult | null>(null);
  const [dedupDeleteAll, setDedupDeleteAll] = useState<boolean>(false);
  const [dedupPreview, setDedupPreview] = useState<DedupPreviewData | null>(null);
  const [dedupConfirming, setDedupConfirming] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [suggestions, setSuggestions] = useState<CategorySuggestionItem[] | null>(null);
  const [suggestionsApplying, setSuggestionsApplying] = useState<boolean>(false);

  const { email } = useGetUserSession();
  const toFetch = fetcher();
  const reduxDispatch = useDispatch<AppDispatch>();
  const ccUser = useSelector((state: RootState) => state.userReducer.data as UserData & { status?: string });

  useEffect(() => {
    if (ccUser.status == "idle") {
      reduxDispatch(fetchUser(email));
    }
  }, [ccUser, email, reduxDispatch]);

  const handleDownloadTemplate = async (): Promise<void> => {
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
    } catch {
      runNotify("error", "Could not download template, please try again 🤕");
    } finally {
      setIsDownloading(false);
    }
  };

  const customRequest: NonNullable<UploadProps["customRequest"]> = async ({ file, onSuccess, onError }) => {
    const userEmail = ccUser.mail || email;
    if (!userEmail) {
      onError?.(new Error("User not available yet, please try again"));
      return;
    }
    setUploadStatus("uploading");
    const formData = new FormData();
    formData.append("file", file as Blob);
    try {
      setUploadStatus("processing");
      const response = await fetch(
        toFetch.getFullPath(`general-data/files/upload/${userEmail}`),
        { method: "POST", body: formData }
      );
      const res = (await response.json()) as UploadApiResponse;
      onSuccess?.(res);
    } catch (e) {
      setUploadStatus("error");
      onError?.(e as Error);
    }
  };

  const uploadProps: UploadProps = {
    name: "file",
    customRequest,
    showUploadList: false,
    onChange(info) {
      if (info.file.status === "done") {
        const res = info.file.response as UploadApiResponse | undefined;
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
        if (created > 0 && res.data) {
          reduxDispatch(addNewTransacctions(res.data));
          fetchSuggestionsFor(
            res.data
              .filter((t) => !t.category && !t.subCategory)
              .map((t) => t._id as string)
          );
        }
        setUploadResult({ count: created });
        setTimeout(() => setUploadStatus("idle"), 3000);
      } else if (info.file.status === "error") {
        setUploadStatus("error");
        const errMsg =
          (info.file.response as UploadApiResponse | undefined)?.message ||
          info.file.error?.message ||
          "The file couldn't be processed, please try again 🤕";
        runNotify("error", errMsg);
        setTimeout(() => setUploadStatus("idle"), 3000);
      }
    },
  };

  const dedupRequest: NonNullable<UploadProps["customRequest"]> = async ({ file, onSuccess, onError }) => {
    const userEmail = ccUser.mail || email;
    if (!userEmail) {
      onError?.(new Error("User not available yet, please try again"));
      return;
    }
    setDedupLoading(true);
    setDedupResult(null);
    setDedupPreview(null);
    const formData = new FormData();
    formData.append("file", file as Blob);
    formData.append("deleteAll", dedupDeleteAll ? "true" : "false");
    formData.append("preview", "true");
    try {
      const response = await fetch(
        toFetch.getFullPath(`general-data/files/deduplicate/${userEmail}`),
        { method: "POST", body: formData }
      );
      const res = (await response.json()) as DedupPreviewData;
      onSuccess?.(res);
    } catch (e) {
      onError?.(e as Error);
    } finally {
      setDedupLoading(false);
    }
  };

  const dedupProps: UploadProps = {
    name: "file",
    customRequest: dedupRequest,
    showUploadList: false,
    onChange(info) {
      if (info.file.status === "done") {
        const res = info.file.response as DedupPreviewData | undefined;
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

  const handleDedupConfirm = async (idsToDelete: string[]): Promise<void> => {
    if (!idsToDelete?.length) {
      setDedupPreview(null);
      return;
    }
    setDedupConfirming(true);
    try {
      const res = (await toFetch.post("general-data/transactions/remove-many", { manyTrans: idsToDelete })) as
        | { ok?: boolean; message?: string }
        | undefined;
      if (res?.ok !== false) {
        reduxDispatch(removeManyTransactions(idsToDelete));
        setDedupResult({ removed: idsToDelete.length, scanned: dedupPreview?.scanned });
        runNotify("ok", `Removed ${idsToDelete.length} duplicate transaction(s) 🧹`);
      } else {
        runNotify("error", res?.message || "Could not delete transactions 🤕");
      }
    } catch {
      runNotify("error", "Could not delete transactions 🤕");
    } finally {
      setDedupConfirming(false);
      setDedupPreview(null);
    }
  };

  const fetchSuggestionsFor = async (transactionIds: string[]): Promise<void> => {
    if (!transactionIds?.length) return;
    const userEmail = ccUser.mail || email;
    try {
      const res = (await toFetch.post("general-data/category-rules/suggest", {
        mail: userEmail,
        transactionIds,
      })) as { ok?: boolean; data?: CategorySuggestionItem[] };
      if (res.ok && res.data && res.data.length > 0) setSuggestions(res.data);
    } catch {
      // suggestions are a nice-to-have, never block the upload flow on failure
    }
  };

  const handleApplySuggestions = async (applications: SuggestionApplication[]): Promise<boolean> => {
    setSuggestionsApplying(true);
    try {
      const res = (await toFetch.post("general-data/category-rules/apply-suggestions", { applications })) as {
        ok?: boolean;
        data?: TransactionData[];
        message?: string;
      };
      if (res.ok && res.data) {
        reduxDispatch(updateManyTransactions(res.data));
        runNotify("ok", `${res.data.length} transaction(s) categorized 🏷️`);
        return true;
      }
      runNotify("error", res?.message || "Could not apply suggestions 🤕");
      return false;
    } catch {
      runNotify("error", "Could not apply suggestions 🤕");
      return false;
    } finally {
      setSuggestionsApplying(false);
    }
  };

  const isUploading = uploadStatus === "uploading" || uploadStatus === "processing";

  return (
    <div className="gf-glass-card py-8 my-2 px-[30px] rounded-[60px] w-full h-full max-w-[900px] flex flex-col gap-4">

      {/* ── Description ── */}
      <div className="text-center">
        <h1 className="text-2xl font-light">Import from Excel</h1>
        <p className="text-xs text-gf-text-muted mt-1 max-w-[300px] mx-auto leading-relaxed">
          Download the Gastify template, fill it with your transactions (date, concept, amount, currency, type) and upload it here. Categories, tags, accounts and account currencies are auto-resolved from your existing ones.
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
              className="gf-glass-button !border-0 !text-white"
            >
              {isUploading ? "Processing..." : "Upload file"}
            </Button>
          </Upload>
        </div>

        <StatusBadge status={uploadStatus} />

        {uploadResult && (
          <div className="flex items-start gap-2 bg-green-500/15 text-green-400 text-xs px-4 py-2 rounded-xl w-full">
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
              className="text-green-400 hover:text-green-300 text-base leading-none shrink-0 mt-[1px]"
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
      <div className="border-t border-gf-border w-full" />

      {/* ── Remove Duplicates section ── */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={() => { setShowDedup(!showDedup); setDedupResult(null); setDedupPreview(null); }}
          className="flex items-center gap-2 text-sm text-gf-text-muted hover:text-purple-500 transition-colors cursor-pointer"
        >
          <MdOutlineCleaningServices size={18} />
          <span>{showDedup ? "Hide" : "Remove duplicates from Excel"}</span>
        </button>

        {showDedup && (
          <div className="flex flex-col items-center gap-3 w-full">
            <p className="text-xs text-gf-text-muted text-center max-w-[280px] leading-relaxed">
              Upload the same Excel you already imported. Transactions that share the exact <b>date</b>, <b>name</b>, <b>amount</b> and <b>currency</b> will be processed according to the mode below.
            </p>

            {/* Toggle delete mode */}
            <div className="flex items-center gap-2 bg-gf-surface-2 rounded-full p-1 text-xs select-none">
              <button
                onClick={() => setDedupDeleteAll(false)}
                className={`px-3 py-1 rounded-full transition-colors ${
                  !dedupDeleteAll
                    ? "bg-gf-accent-soft-bg text-purple-300 font-medium shadow-sm"
                    : "text-gf-text-muted hover:text-gf-text-muted"
                }`}
              >
                Keep one original
              </button>
              <button
                onClick={() => setDedupDeleteAll(true)}
                className={`px-3 py-1 rounded-full transition-colors ${
                  dedupDeleteAll
                    ? "bg-red-500/15 text-red-400 font-medium shadow-sm"
                    : "text-gf-text-muted hover:text-gf-text-muted"
                }`}
              >
                Delete all matches
              </button>
            </div>
            <p className="text-[10px] text-gf-text-muted text-center max-w-[260px] -mt-1 leading-relaxed">
              {dedupDeleteAll
                ? "Every transaction matching a row in the file will be deleted — nothing is kept."
                : "One record is always kept per group — only the extra copies are removed."}
            </p>

            <div onClick={(e) => e.stopPropagation()}>
              <Upload {...dedupProps}>
                <Button
                  icon={<MdOutlineCleaningServices size={14} />}
                  loading={dedupLoading}
                  className={`text-xs ${dedupDeleteAll ? "!border-red-400 !text-red-400 hover:!border-red-500" : ""}`}
                >
                  {dedupLoading ? "Scanning for duplicates..." : "Upload & Clean"}
                </Button>
              </Upload>
            </div>

            {dedupResult && (
              <div className={`flex items-start gap-2 text-xs px-4 py-2 rounded-xl w-full ${dedupResult.removed > 0 ? "bg-green-500/15 text-green-400" : "bg-gf-surface-2 text-gf-text-muted"}`}>
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
                  className={`text-base leading-none shrink-0 mt-[1px] ${dedupResult.removed > 0 ? "text-green-400 hover:text-green-300" : "text-gf-text-muted hover:text-gf-text-muted"}`}
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

      {suggestions && (
        <CategorySuggestionsModal
          suggestions={suggestions}
          onConfirm={handleApplySuggestions}
          onCancel={() => setSuggestions(null)}
          confirming={suggestionsApplying}
        />
      )}
    </div>
  );
}

export default ReadFileComp;
