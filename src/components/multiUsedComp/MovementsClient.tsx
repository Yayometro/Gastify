"use client";

import React, { useEffect, useState } from "react";
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
// on the right (60 %), as tall as the tools. Narrower screens stack everything: the tools are buttons, the transactions below.
const WIDE_QUERY = "(min-width: 1024px)";

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
  // Redux
  const dispatch = useDispatch<AppDispatch>();
  const ccUser = useSelector((state: RootState) => state.userReducer);
  const ccategories = useSelector((state: RootState) => state.categoriesReducer);
  const ccSubCategories = useSelector((state: RootState) => state.subCategoryReducer);
  const ccAccounts = useSelector((state: RootState) => state.accountsReducer);

  const wide = useIsWide();

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
        <div className="content-profile-cont w-full h-full content-wallet-glass text-center items-center mt-[10px] sm:mt-[20px] rounded-t-[100px] rounded-b-2xl px-2 pt-6 pb-[80px]">
          <div className="cc-categoryList-cont w-full flex flex-col justify-center items-center">
            <h1 className="text-3xl min-[text-[45px]]: py-2">
              Movements details
            </h1>
          </div>
          <div className={wide ? "grid grid-cols-[2fr_3fr] items-stretch gap-4" : "flex flex-col gap-4"}>
            {/* The tools: the two cards on wide screens, the two buttons (each opens its tool) on narrow ones. */}
            <div className={wide ? "flex min-w-0 flex-col gap-4" : "flex flex-wrap items-center justify-center gap-3"}>
              {wide ? (
                <>
                  <TypedReadFileComp />
                  <TypedCategorySuggestionsSection mail={mcSession} variant="card" />
                </>
              ) : (
                <>
                  <ImportFromExcelButton />
                  <TypedCategorySuggestionsSection mail={mcSession} variant="button" />
                </>
              )}
            </div>
            {/* The transactions: as tall as the tools column on wide screens (the list scrolls inside), a fixed box on narrow ones. */}
            <div className={wide ? "relative min-w-0" : "relative h-[640px]"}>
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
