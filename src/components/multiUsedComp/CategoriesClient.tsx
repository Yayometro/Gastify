"use client";

import TutorialTip from "@/components/tour/TutorialTip";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Modal } from "antd";
import { useSelector, useDispatch } from "react-redux";
import EmptyModule from "./EmptyModule";
import "@/components/styles/animations.css";
import UniversalCategoIcon from "./UniversalCategoIcon";
import CategoryList from "./CategoryList";
import CategoryAnalyzer from "./CategoryAnalyzer";
import EditCategoryModal from "./EditCategoryModal";
import SelectCategories from "@/components/categories/SelectCategoryProvider/SelectCategories";
import SubCategoryList from "./SubCategoryList";

import { fetchCategories, type CategoryData } from "@/lib/features/categoriesSlice";
import { fetchUser, type UserData } from "@/lib/features/userSlice";
import { fetchSubCat, type SubCategoryData } from "@/lib/features/subCategorySlice";
import type { AppDispatch, RootState } from "@/lib/store";
import { formatMoneyMajor } from "@gastify/core/money/currencies";
import type { TransactionData } from "@/lib/features/transacctionsSlice";
import type { BudgetData } from "@/lib/features/budgetSlice";
import { useT, useInfo } from "@/i18n/client";
import { InfoTip } from "@/components/multiUsedComp/InfoTip";

export interface CategoriesClientProps {
  ccData?: unknown;
  ccSession?: string | null;
  readOnly?: boolean;
}

function CategoriesClient({ ccSession, readOnly = false }: CategoriesClientProps): React.JSX.Element {
  const t = useT();
  const { APP_INFO } = useInfo();
  const [onEdition, setOnEdition] = useState<string | boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDetail, setSelectedDetail] = useState<CategoryData | SubCategoryData | null>(null);
  // The page has two tabs: the analyzer of one category (the main one) and the list. The demo only has the list.
  const [tab, setTab] = useState<"analyzer" | "list">(readOnly ? "list" : "analyzer");
  useEffect(() => {
    if (readOnly) return;
    try {
      if (window.localStorage.getItem("gf-categories-tab") === "list") setTab("list");
    } catch {
      // Without storage the page simply starts on the analyzer.
    }
  }, [readOnly]);
  const chooseTab = (next: "analyzer" | "list") => {
    setTab(next);
    try {
      window.localStorage.setItem("gf-categories-tab", next);
    } catch {
      // The tab is only a convenience: without storage it simply starts on the analyzer.
    }
  };

  // Redux
  const dispatch = useDispatch<AppDispatch>();
  const ccUser = useSelector((state: RootState) => state.userReducer);
  const ccategories = useSelector((state: RootState) => state.categoriesReducer);
  const ccSubCategories = useSelector((state: RootState) => state.subCategoryReducer);
  const transactions = useSelector((state: RootState) => state.transacctionsReducer.data) as TransactionData[];
  const budgets = useSelector((state: RootState) => state.budgetReducer.data) as BudgetData[];
  const walletCurrency = useSelector((state: RootState) => (state.walletReducer.data as { primaryCurrency?: string } | null)?.primaryCurrency) || "MXN";
  
  // const seeGeneralData = useSelector((state) => state.generalDataReducer);
  const userData = ccUser.data;
  const categoriesData: CategoryData[] = ccategories.data.user;
  const defCategoriesData: CategoryData[] = ccategories.data.default;
  const subCategoriesData: SubCategoryData[] = ccSubCategories.data.subCat;
  const defSubCategoriesData: SubCategoryData[] = ccSubCategories.data.default;

  const allCategoriesData = categoriesData.concat(defCategoriesData);
  const allSubCategoriesData = subCategoriesData.concat(defSubCategoriesData);

  const selectedParent = useMemo(() => {
    if (!selectedDetail) return null;
    const father = (selectedDetail as SubCategoryData).fatherCategory;
    if (!father) return selectedDetail as CategoryData;
    const fatherId = typeof father === "object" && father !== null ? String((father as CategoryData)._id || "") : String(father);
    return allCategoriesData.find((category) => String(category._id) === fatherId) || null;
  }, [selectedDetail, allCategoriesData]);
  const selectedIsSubcategory = Boolean(selectedDetail && (selectedDetail as SubCategoryData).fatherCategory);
  const selectedTransactions = useMemo(() => {
    if (!selectedDetail) return [];
    const selectedId = String(selectedDetail._id || "");
    return transactions
      .filter((transaction) => selectedIsSubcategory
        ? String((transaction.subCategory as { _id?: string } | null)?._id || "") === selectedId
        : String((transaction.category as { _id?: string } | null)?._id || "") === selectedId)
      .sort((a, b) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime());
  }, [selectedDetail, selectedIsSubcategory, transactions]);
  const selectedSpent = selectedTransactions
    .filter((transaction) => transaction.isBill)
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
  const selectedSubcategories = selectedDetail && !selectedIsSubcategory
    ? allSubCategoriesData.filter((subcategory) => {
        const father = subcategory.fatherCategory;
        const fatherId = typeof father === "object" && father !== null ? String((father as CategoryData)._id || "") : String(father || "");
        return fatherId === String(selectedDetail._id || "");
      })
    : [];
  const selectedBudget = selectedDetail && !selectedIsSubcategory
    ? budgets.find((budget) => String(budget.category || "") === String(selectedDetail._id || "") || (budget.categories || []).some((entry) => String((entry.category as CategoryData | undefined)?._id || "") === String(selectedDetail._id || "")))
    : undefined;

  const sortByName = (a: { name?: string }, b: { name?: string }) =>
    (a?.name || "").localeCompare(b?.name || "");
  const sortedCategoriesData = [...categoriesData].sort(sortByName);
  const sortedDefCategoriesData = [...defCategoriesData].sort(sortByName);

  const matchesQuery = (name?: string) => (name || "").toLowerCase().includes(searchQuery.trim().toLowerCase());
  const filteredCategoriesData = sortedCategoriesData.filter((c) => matchesQuery(c.name));
  const filteredSubCategoriesData = subCategoriesData.filter((c) => matchesQuery(c.name));
  const filteredDefCategoriesData = sortedDefCategoriesData.filter((c) => matchesQuery(c.name));
  const filteredDefSubCategoriesData = defSubCategoriesData.filter((c) => matchesQuery(c.name));

  const nameGeneral = (ccUser?.data as UserData)?.fullName;
  
  useEffect(() => {
    // User
    if (!readOnly && ccUser.status == 'idle') {
      dispatch(fetchUser(ccSession));
    }
    // Categories
    if (!readOnly && ccategories.status == 'idle') {
      dispatch(fetchCategories(ccSession));
    }
    // Sub-categories
    if (!readOnly && ccSubCategories.status == 'idle') {
      dispatch(fetchSubCat(ccSession));
    }
  }, [ccUser.status, ccategories.status, ccSubCategories.status, ccSession, dispatch, readOnly]);

  return (
    <div className=" w-full h-full sm:pr-2">
      <div className="w-full h-full relative">
          <div className="w-full profile-img py-4 text-center text-white">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-thin">
              {t("categories.list.title", { p1: nameGeneral || "" })}
              <span aria-hidden="true" className="mx-2 inline-block h-5 w-px shrink-0 align-middle bg-purple-300/40" /><InfoTip info={APP_INFO.categor_as_y_subcategor_as} />
              <TutorialTip className="ml-0.5" tour="categories" label={t("navbar.categories")} />
            </h1>
          </div>
          <div className="content-profile-cont w-full h-full content-wallet-glass text-center items-center mt-[10px] sm:mt-[20px] rounded-t-[100px] rounded-b-2xl px-2 pt-6 pb-[80px]">
            {!readOnly && (
              <div className="mb-4 flex justify-center" data-tour="cat-tabs" role="tablist">
                <div className="flex gap-1 rounded-full border border-gf-border bg-gf-surface p-1">
                  {(["analyzer", "list"] as const).map((id) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={tab === id}
                      data-tour={id === "analyzer" ? "cat-tab-analyzer" : "cat-tab-list"}
                      onClick={() => chooseTab(id)}
                      className={`rounded-full px-5 py-1.5 text-sm font-semibold transition-colors ${tab === id ? "bg-purple-500/40 text-white" : "text-gf-text-muted hover:text-white"}`}
                    >
                      {t(`categories.tab.${id}`)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {tab === "analyzer" && !readOnly && (
              <div className="flex w-full justify-center">
                <CategoryAnalyzer />
              </div>
            )}
            {(tab === "list" || readOnly) && <div className="cc-categoryList-cont w-full flex flex-col gap-3 justify-center items-center">
              {!readOnly && <div className="flex items-center gap-2"><div
                data-tour="cat-create"
                className="cc-create-new-cat-cont flex gap-2 justify-center items-center gf-glass-button px-2 py-1 min-w-[150px] sm:min-w-[250px] rounded-3xl text-white cursor-pointer"
                onClick={() => {
                  setOnEdition('creation');
                }}
              >
                <p className="">{t("categories.create")}</p>
                <UniversalCategoIcon
                  type={`md/MdAddCircleOutline`}
                  siz={30}
                  className={` w-[15px] min-[400px]:w-[25px]`}
                />
              </div><span aria-hidden="true" className="mx-2 inline-block h-5 w-px shrink-0 align-middle bg-purple-300/40" /><TutorialTip tour="catCreate" label={t("tour.catCreate.name")} /></div>}
              <input
                data-tour="cat-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("categories.search")}
                className="w-full max-w-[400px] h-10 rounded-3xl gf-glass-inset px-4 text-gf-text"
              />
              {!readOnly && <SelectCategories>
                <EditCategoryModal
                  ecmMode={onEdition}
                  ecmCategory={undefined}
                  ecmClose={(e) => setOnEdition(e)}
                  ecmData={{
                      user: userData,
                      categories: allCategoriesData
                  }}
                />
              </SelectCategories>}
              <div className="cc-categoryList-cont-suv flex gap-2 flex-col flex-wrap">
                <div className="category-list-container" data-tour="cat-yours">
                  <h1 className="text-2xl font-thin py-2">{t("categories.list.yours")}<span aria-hidden="true" className="mx-2 inline-block h-5 w-px shrink-0 align-middle bg-purple-300/40" /><TutorialTip className="ml-0.5" tour="catYours" label={t("tour.catYours.name")} /></h1>
                  {categoriesData.length === 0 ? (
                    <EmptyModule
                      emMessage={t("categories.emptyCategories")}
                    />
                  ) : (
                    <CategoryList tileTour="cat-tile" clCategories={filteredCategoriesData} clUser={userData} readOnly={readOnly} onSelectCategory={setSelectedDetail}/>
                  )}
                </div>
                <div className="category-list-container" data-tour="cat-yours-sub">
                  <h1 className="text-2xl font-thin py-2">{t("categories.list.yoursSub")}</h1>
                  {subCategoriesData.length === 0 ? (
                    <EmptyModule
                      emMessage={t("categories.emptySubcategories")}
                    />
                  ) : (
                    <SubCategoryList tileTour="cat-tile-sub" sclSubCategory={filteredSubCategoriesData} clUser={userData} sclCategories={categoriesData} readOnly={readOnly} onSelectSubcategory={setSelectedDetail}/>
                  )}
                </div>
                <div className="category-list-container" data-tour="cat-defaults">
                  <h1 className="text-2xl font-thin py-2">
                    {t("categories.list.defaults")}
                    <span aria-hidden="true" className="mx-2 inline-block h-5 w-px shrink-0 align-middle bg-purple-300/40" /><InfoTip info={APP_INFO.categor_as_predeterminadas} />
                  </h1>
                  {defCategoriesData.length === 0 ? (
                    <EmptyModule
                      emMessage={t("categories.emptyCategories")}
                    />
                  ) : (
                    <CategoryList tileTour="cat-tile-default" clCategories={filteredDefCategoriesData} clUser={userData} readOnly={readOnly} onSelectCategory={setSelectedDetail}/>
                  )}
                </div>
                <div className="category-list-container" data-tour="cat-defaults-sub">
                  <h1 className="text-2xl font-thin py-2">
                    {t("categories.list.defaultsSub")}
                  </h1>
                  {defSubCategoriesData.length === 0 ? (
                    <EmptyModule
                      emMessage={t("categories.emptySubcategories")}
                    />
                  ) : (
                    <SubCategoryList sclSubCategory={filteredDefSubCategoriesData} clUser={userData} sclCategories={defCategoriesData} readOnly={readOnly} onSelectSubcategory={setSelectedDetail}/>
                  )}
                </div>
              </div>
        {readOnly && selectedDetail && (
          <Modal
            open
            centered
            footer={null}
            onCancel={() => setSelectedDetail(null)}
            title={null}
            width={560}
            aria-label={t("shared.demo.categories.detailsTitle", { p1: selectedDetail.name || "" })}
          >
            <div className="space-y-4 pt-2 text-left">
              <div className="flex items-start gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white" style={{ backgroundColor: selectedDetail.color || selectedParent?.color || "#8b6acb" }}>
                  <UniversalCategoIcon type={selectedDetail.icon || selectedParent?.icon || "md/MdOutlineCategory"} siz={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[.14em] text-purple-300">{selectedIsSubcategory ? t("shared.demo.categories.subcategory") : t("shared.demo.categories.category")}</p>
                  <h2 className="truncate text-xl font-semibold text-white">{selectedDetail.name}</h2>
                  {selectedParent && selectedIsSubcategory && <p className="mt-0.5 text-xs text-gf-text-muted">{t("shared.demo.categories.under", { p1: selectedParent.name || "" })}</p>}
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gf-text-muted">{t("shared.demo.categories.spent")}</p>
                  <p className="font-semibold text-purple-100">{formatMoneyMajor(selectedSpent, walletCurrency)}</p>
                </div>
              </div>

              {selectedBudget && <div className="rounded-2xl border border-purple-200/10 bg-purple-300/[.06] px-4 py-3">
                <p className="text-[10px] uppercase tracking-wide text-gf-text-muted">{t("shared.demo.categories.budget")}</p>
                <p className="mt-1 flex items-baseline justify-between gap-3 text-sm"><strong className="truncate text-purple-100">{selectedBudget.name || selectedDetail.name}</strong><span className="shrink-0 font-semibold text-white">{formatMoneyMajor(Number(selectedBudget.goalAmount || 0), walletCurrency)} <span className="text-[10px] font-normal text-gf-text-muted">/ {t("budgets.period.monthly")}</span></span></p>
              </div>}

              {!selectedIsSubcategory && selectedSubcategories.length > 0 && <div>
                <h3 className="mb-2 text-xs font-semibold text-purple-100">{t("shared.demo.categories.subcategories")}</h3>
                <div className="flex flex-wrap gap-2">{selectedSubcategories.map((subcategory) => <span key={subcategory._id} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1 text-[11px] text-purple-50"><UniversalCategoIcon type={subcategory.icon || "md/MdOutlineCategory"} siz={12}/>{subcategory.name}</span>)}</div>
              </div>}

              <div>
                <h3 className="mb-2 text-xs font-semibold text-purple-100">{t("shared.demo.categories.recentMovements")}</h3>
                {selectedTransactions.length ? <ul className="divide-y divide-white/[.07] rounded-2xl border border-white/[.08] px-3">
                  {selectedTransactions.slice(0, 4).map((transaction) => <li key={transaction._id} className="flex items-center justify-between gap-3 py-2.5 text-xs"><span className="min-w-0"><strong className="block truncate text-white">{transaction.name}</strong><span className="text-[10px] text-gf-text-muted">{new Date(transaction.date || transaction.createdAt || 0).toLocaleDateString()}</span></span><span className={transaction.isBill ? "shrink-0 font-semibold text-rose-200" : "shrink-0 font-semibold text-emerald-200"}>{formatMoneyMajor(Number(transaction.amount || 0), walletCurrency)}</span></li>)}
                </ul> : <p className="rounded-xl border border-white/[.07] px-3 py-3 text-xs text-gf-text-muted">{t("shared.demo.categories.noMovements")}</p>}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link href="/demo/movements" onClick={() => setSelectedDetail(null)} className="gf-glass-button rounded-xl px-3 py-2 text-center text-xs font-semibold text-white">{t("shared.demo.categories.openMovements")}</Link>
                <Link href="/demo/budgets" onClick={() => setSelectedDetail(null)} className="rounded-xl border border-purple-200/15 bg-white/[.04] px-3 py-2 text-center text-xs font-semibold text-purple-100 transition hover:bg-white/[.08]">{t("shared.demo.categories.openBudgets")}</Link>
              </div>
              <p className="text-[10px] leading-relaxed text-gf-text-muted">{t("shared.demo.categories.detailPreview")}</p>
            </div>
          </Modal>
        )}
            </div>}
            {/* <div className="asociatedCategories py-3 px-1 flex gap-1 justify-center items-center flex-wrap">
              {categories.map((category) => (
                <Category
                  category={category}
                  key={category._id + String(Math.random(1))}
                />
              ))}
            </div> */}
          </div>
        </div>
    </div>
  );
}

export default CategoriesClient;
