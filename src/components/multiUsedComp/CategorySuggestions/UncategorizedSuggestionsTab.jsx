"use client";

import { useEffect, useState } from "react";
import { Spin } from "antd";
import fetcher from "@/helpers/fetcher";
import runNotify from "@/helpers/gastifyNotifier";
import SuggestionsList from "@/components/multiUsedComp/CategorySuggestions/SuggestionsList";

// Reviews suggestions for ALL of a wallet's already-existing uncategorized
// transactions (not just ones from a fresh Excel upload) - fetches on mount.
function UncategorizedSuggestionsTab({ mail, onApplied }) {
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [applying, setApplying] = useState(false);
  const toFetch = fetcher();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    toFetch
      .post("general-data/category-rules/suggest", { mail })
      .then((res) => {
        if (!cancelled && res.ok) setSuggestions(res.data || []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mail]);

  const handleApply = async (applications) => {
    setApplying(true);
    try {
      const res = await toFetch.post("general-data/category-rules/apply-suggestions", { applications });
      if (res.ok) {
        runNotify("ok", `${res.data.length} transaction(s) categorized 🏷️`);
        const appliedIds = new Set(applications.map((a) => String(a.transactionId)));
        setSuggestions((prev) => prev.filter((s) => !appliedIds.has(String(s.transaction._id))));
        onApplied?.(res.data);
        return true;
      }
      runNotify("error", res?.message || "Could not apply suggestions 🤕");
      return false;
    } catch (e) {
      runNotify("error", "Could not apply suggestions 🤕");
      return false;
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10">
        <Spin />
        <p className="text-xs text-slate-400">Scanning uncategorized transactions...</p>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center py-10">
        No suggestions right now — you&apos;re all caught up! 🎉
      </p>
    );
  }

  return (
    <div>
      <p className="text-xs text-slate-400 text-center mb-3">
        {suggestions.length} uncategorized transaction{suggestions.length !== 1 ? "s" : ""} matched a rule · uncheck any to skip
      </p>
      <SuggestionsList
        suggestions={suggestions}
        onConfirm={handleApply}
        confirming={applying}
      />
    </div>
  );
}

export default UncategorizedSuggestionsTab;
