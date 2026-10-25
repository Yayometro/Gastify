"use client";

import React, { useEffect, useRef, useState } from "react";
import Movements from "./Movements";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories } from "@/lib/features/categoriesSlice";
import { fetchSubCat } from "@/lib/features/subCategorySlice";
import { fetchUser } from "@/lib/features/userSlice";
import { fetchAccounts } from "@/lib/features/accountsSlice";
import ReadFileComp from "./ReadFileComp";
import ImportFromExcelButton from "./ImportFromExcelButton";
import CategorySuggestionsSection from "./CategorySuggestions/CategorySuggestionsSection";
import type { AppDispatch, RootState } from "@/lib/store";
import { useT } from "@/i18n/client";

// Typed bridges for unmigrated child JSX components
const TypedMovements = Movements as React.ComponentType<{
  mail?: string | null;
  timePeriodFromFather?: Date[];
  embedded?: boolean;
}>;

const TypedReadFileComp = ReadFileComp as React.ComponentType<Record<string, never>>;

const TypedCategorySuggestionsSection = CategorySuggestionsSection as React.ComponentType<{
  mail?: string | null;
  variant?: "card" | "button";
}>;

// From a horizontal tablet or a laptop on, the page is split in two: the two tools on the left (40 %) and the transactions
// on the right (60 %). Narrower screens stack everything: the tools are buttons, the transactions below.
const WIDE_QUERY = "(min-width: 1024px)";
// How far the split stops short of the bottom of the window, in pixels.
const BOTTOM_GAP = 8;
const MIN_SPLIT_HEIGHT = 480;

function useIsWide(): boolean {
  const [wide, setWide] = useState<boolean>(false);
  useEffect(() => {
    const media = window.matchMedia(WIDE_QUERY);
    const update = () => setWide(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return wide;
}

export interface MovementsClientProps {
  mcData?: unknown;
  mcSession?: string | null;
}

function MovementsClient({ mcSession }: MovementsClientProps): React.JSX.Element {
  const t = useT();
  // Redux
  const dispatch = useDispatch<AppDispatch>();
  const ccUser = useSelector((state: RootState) => state.userReducer);
  const ccategories = useSelector((state: RootState) => state.categoriesReducer);
  const ccSubCategories = useSelector((state: RootState) => state.subCategoryReducer);
  const ccAccounts = useSelector((state: RootState) => state.accountsReducer);

  const wide = useIsWide();

  // On wide screens the split runs from its top down to the bottom of the window (less a few pixels), so the transactions
  // fill the screen and the tools column is as tall as they are.
  const splitRef = useRef<HTMLDivElement | null>(null);
  const [splitHeight, setSplitHeight] = useState<number>(0);
  useEffect(() => {
    if (!wide) return;
    const fit = () => {
      const node = splitRef.current;
      if (!node) return;
      // The top in the document, so the height does not change when the page is scrolled.
      const top = node.getBoundingClientRect().top + window.scrollY;
      setSplitHeight(Math.max(MIN_SPLIT_HEIGHT, Math.round(window.innerHeight - top - BOTTOM_GAP)));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [wide]);

  useEffect(() => {
    // User
    if (ccUser.status === "idle") {
      dispatch(fetchUser(mcSession));
    }
    // Categories
    if (ccategories.status === "idle") {
      dispatch(fetchCategories(mcSession));
    }
    // Sub-categories
    if (ccSubCategories.status === "idle") {
      dispatch(fetchSubCat(mcSession));
    }
    if (ccAccounts.status === "idle") {
      dispatch(fetchAccounts(mcSession));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className=" w-full h-full sm:pr-2">
      <div className="w-full h-full relative">
        <div className="content-profile-cont w-full content-wallet-glass text-center items-center mt-[10px] rounded-t-[100px] rounded-b-2xl px-2 pt-3 pb-[80px] min-h-[calc(100dvh-20px)]">
          <div className="cc-categoryList-cont w-full flex flex-col justify-center items-center">
            <h1 className="text-3xl min-[text-[45px]]: py-2">
              {t("movements.title")}
            </h1>
          </div>
          <div
            ref={splitRef}
            className={wide ? "grid grid-cols-[2fr_3fr] items-stretch gap-4" : "flex flex-col gap-4"}
          >
            {/* The tools: the two cards on wide screens (the categorizer takes the height left under the import), the two
                buttons (each opens its tool) on narrow ones. */}
            <div className={wide ? "flex min-w-0 flex-col gap-4" : "flex flex-wrap items-center justify-center gap-3"}>
              {wide ? (
                <>
                  <div className="shrink-0">
                    <TypedReadFileComp />
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col">
                    <TypedCategorySuggestionsSection mail={mcSession} variant="card" />
                  </div>
                </>
              ) : (
                <>
                  <ImportFromExcelButton />
                  <TypedCategorySuggestionsSection mail={mcSession} variant="button" />
                </>
              )}
            </div>
            {/* The transactions: on wide screens as tall as the split (the list scrolls inside), a fixed box on narrow ones. */}
            <div className={wide ? "relative min-w-0" : "relative h-[640px]"} style={wide ? { minHeight: splitHeight } : undefined}>
              <div className="gf-glass-frost absolute inset-0 flex flex-col rounded-[32px] p-4">
                <TypedMovements mail={mcSession} embedded />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MovementsClient;
