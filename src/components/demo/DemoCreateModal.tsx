"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  IoAirplaneOutline,
  IoArrowDownCircleOutline,
  IoCashOutline,
  IoDocumentAttachOutline,
  IoPieChartOutline,
  IoPricetagOutline,
  IoSwapHorizontalOutline,
  IoWalletOutline,
  IoAdd,
  IoClose,
} from "react-icons/io5";
import { lockBodyScroll, unlockBodyScroll } from "@/helpers/scrollLock";
import { useT } from "@/i18n/client";
import CategoryColorPicker from "@/components/multiUsedComp/CategoryColorPicker";
import IconDisplayerMenu from "@/components/multiUsedComp/IconDisplayerMenu";
import UniversalCategoIcon from "@/components/multiUsedComp/UniversalCategoIcon";
import DemoCategoryPicker, { type DemoCategoryChoice } from "@/components/demo/DemoCategoryPicker";
import { DEMO_CATEGORIES, DEMO_DEFAULT_CATEGORIES, DEMO_DEFAULT_SUBCATEGORIES, DEMO_SUBCATEGORIES } from "@/lib/demo/demoData";

const options = [
  { id: "expense", label: "movements.option.transaction", summary: "shared.demo.createSummary.transaction", help: "shared.demo.createHelp.transaction", icon: IoArrowDownCircleOutline },
  { id: "transfer", label: "movements.help.transfer", summary: "shared.demo.createSummary.transfer", help: "shared.demo.createHelp.transfer", icon: IoSwapHorizontalOutline },
  { id: "account", label: "movements.new.account", summary: "shared.demo.createSummary.account", help: "shared.demo.createHelp.account", icon: IoWalletOutline },
  { id: "category", label: "movements.new.category", summary: "shared.demo.createSummary.category", help: "shared.demo.createHelp.category", icon: IoPricetagOutline },
  { id: "budget", label: "movements.help.budget", summary: "shared.demo.createSummary.budget", help: "shared.demo.createHelp.budget", icon: IoPieChartOutline },
  { id: "saving", label: "movements.help.saving", summary: "shared.demo.createSummary.saving", help: "shared.demo.createHelp.saving", icon: IoCashOutline },
  { id: "project", label: "movements.help.project", summary: "shared.demo.createSummary.project", help: "shared.demo.createHelp.project", icon: IoAirplaneOutline },
  { id: "excel", label: "movements.help.importTitle", summary: "shared.demo.createSummary.excel", help: "shared.demo.createHelp.excel", icon: IoDocumentAttachOutline },
] as const;

type CreateOption = (typeof options)[number];

const currencyOptions = ["MXN", "USD", "EUR", "JPY"];
const previewControlClass = "w-full min-w-0 rounded-xl border border-white/10 bg-[#130d20]/70 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-purple-100/35 focus:border-purple-200/50";

const categoryNameKeys: Record<string, string> = {
  home: "shared.demo.sample.homeCategory",
  groceries: "shared.demo.sample.groceriesCategory",
  transport: "shared.demo.sample.transportCategory",
  travel: "shared.demo.sample.travelCategory",
  dining: "shared.demo.sample.diningCategory",
  health: "shared.demo.sample.healthCategory",
  subscriptions: "shared.demo.sample.subscriptionsCategory",
  entertainment: "shared.demo.sample.entertainmentCategory",
  utilities: "shared.demo.sample.utilitiesCategory",
  income: "shared.demo.sample.incomeCategory",
  education: "shared.demo.sample.educationCategory",
  pets: "shared.demo.sample.petsCategory",
  "personal-care": "shared.demo.sample.personalCareCategory",
  shopping: "shared.demo.sample.shoppingCategory",
  gifts: "shared.demo.sample.giftsCategory",
  taxes: "shared.demo.sample.taxesCategory",
  insurance: "shared.demo.sample.insuranceCategory",
};

const subcategoryNameKeys: Record<string, string> = {
  "home-rent": "shared.demo.sample.subcategory.homeRent",
  "home-household": "shared.demo.sample.subcategory.homeHousehold",
  "groceries-market": "shared.demo.sample.subcategory.groceriesMarket",
  "groceries-coffee": "shared.demo.sample.subcategory.groceriesCoffee",
  "transport-fuel": "shared.demo.sample.subcategory.transportFuel",
  "transport-rides": "shared.demo.sample.subcategory.transportRides",
  "dining-restaurants": "shared.demo.sample.subcategory.diningRestaurants",
  "dining-coffee": "shared.demo.sample.subcategory.diningCoffee",
  "health-pharmacy": "shared.demo.sample.subcategory.healthPharmacy",
  "health-care": "shared.demo.sample.subcategory.healthCare",
  "travel-flights": "shared.demo.sample.subcategory.travelFlights",
  "travel-lodging": "shared.demo.sample.subcategory.travelLodging",
  "travel-local": "shared.demo.sample.subcategory.travelLocal",
  "subscriptions-digital": "shared.demo.sample.subcategory.subscriptionsDigital",
  "utilities-home": "shared.demo.sample.subcategory.utilitiesHome",
  "education-courses": "shared.demo.sample.subcategory.educationCourses",
  "education-tuition": "shared.demo.sample.subcategory.educationTuition",
  "pets-food": "shared.demo.sample.subcategory.petsFood",
  "pets-vet": "shared.demo.sample.subcategory.petsVet",
  "shopping-clothing": "shared.demo.sample.subcategory.shoppingClothing",
  "shopping-electronics": "shared.demo.sample.subcategory.shoppingElectronics",
  "gifts-celebrations": "shared.demo.sample.subcategory.giftsCelebrations",
  "taxes-government": "shared.demo.sample.subcategory.taxesGovernment",
};

function translateDemoCategoryName(id: string, fallback: string, t: ReturnType<typeof useT>): string {
  const key = categoryNameKeys[id];
  return key ? t(key) : fallback;
}

function PreviewField({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }): React.JSX.Element {
  return <label className={`grid min-w-0 gap-1.5 text-[11px] font-medium text-purple-100/75 ${className}`}>
    <span>{label}</span>{children}
  </label>;
}

function DemoCreateFields({ kind, onModalOpenChange }: { kind: CreateOption["id"]; onModalOpenChange: (open: boolean) => void }): React.JSX.Element {
  const t = useT();
  const [values, setValues] = useState<Record<string, string>>({
    movementType: "expense", concept: t("shared.demo.sample.coffee"), amount: "850", date: "2026-10-26",
    account: t("shared.demo.sample.account"), category: t("shared.demo.sample.groceriesCategory"), note: "Pago con tarjeta",
    source: t("shared.demo.sample.account"), destination: t("shared.demo.sample.foreignAccount"),
    accountName: t("shared.demo.sample.accountName"), accountType: t("shared.demo.sample.accountType"), currency: "MXN",
    institution: "BBVA", country: t("shared.demo.profileSettings.countryMexico"), openingBalance: "25000",
    categoryName: t("shared.demo.sample.categoryName"), categoryKind: "category", parent: t("shared.demo.sample.homeCategory"), budgetName: t("shared.demo.sample.budget"),
    period: "monthly", goalName: t("shared.demo.sample.goal"), currentSaved: "12000", targetDate: "2027-06-30",
    projectName: t("shared.demo.sample.project"), startDate: "2026-10-01", endDate: "2027-01-31", status: "planned",
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["groceries"]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("groceries");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState("groceries-market");
  const [selectedParentCategoryId, setSelectedParentCategoryId] = useState("home");
  const [selectedIcon, setSelectedIcon] = useState(kind === "project" ? "fluent/airplane" : "fluent/pizza");
  const [selectedColor, setSelectedColor] = useState("#a879f4");

  const update = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }));
  const input = (key: string, labelKey: string, type = "text", placeholder = "") => (
    <PreviewField label={t(labelKey)} key={key}>
      <input className={previewControlClass} type={type} value={values[key] || ""} placeholder={placeholder} onChange={(event) => update(key, event.target.value)} />
    </PreviewField>
  );
  const select = (key: string, labelKey: string, options: { value: string; label: string }[]) => (
    <PreviewField label={t(labelKey)} key={key}>
      <select className={previewControlClass} value={values[key] || options[0]?.value || ""} onChange={(event) => update(key, event.target.value)}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </PreviewField>
  );
  const simpleOptions = (...items: { value: string; label: string }[]) => items;
  const accountOptions = simpleOptions(
    { value: t("shared.demo.sample.account"), label: t("shared.demo.sample.account") },
    { value: t("shared.demo.sample.foreignAccount"), label: t("shared.demo.sample.foreignAccount") },
  );
  const categoryOptions: DemoCategoryChoice[] = [...DEMO_CATEGORIES, ...DEMO_DEFAULT_CATEGORIES].map((category) => ({
    id: category.id,
    name: translateDemoCategoryName(category.id, category.name, t),
    icon: category.icon,
    color: category.color,
  }));
  const categoryById = new Map(categoryOptions.map((category) => [category.id, category]));
  const subcategoryOptions: DemoCategoryChoice[] = [...DEMO_SUBCATEGORIES, ...DEMO_DEFAULT_SUBCATEGORIES].map((subcategory) => ({
    id: subcategory.id,
    name: subcategoryNameKeys[subcategory.id] ? t(subcategoryNameKeys[subcategory.id]) : subcategory.name,
    icon: subcategory.icon,
    color: subcategory.color,
    parentName: categoryById.get(subcategory.categoryId)?.name,
  }));
  const availableSubcategories = subcategoryOptions.filter((subcategory) => {
    return [...DEMO_SUBCATEGORIES, ...DEMO_DEFAULT_SUBCATEGORIES].some((item) => item.id === subcategory.id && item.categoryId === selectedCategoryId);
  });
  const currencyChoices = currencyOptions.map((currency) => ({ value: currency, label: currency }));
  const iconSelector = <>
    <div className="sm:col-span-2">
      <span className="mb-2 block text-[11px] font-medium text-purple-100/75">{t("shared.demo.create.iconPalette")}</span>
      <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/10 bg-black/15 px-3 py-2">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-purple-300/15 text-purple-100"><UniversalCategoIcon type={selectedIcon} siz={23} /></span>
        <span className="text-xs text-purple-100/70">{t("shared.demo.create.selectedIcon")}</span>
      </div>
      <IconDisplayerMenu idmValue={selectedIcon} idmIcon={setSelectedIcon} showCatalogSummary initialPageSize={100} />
    </div>
  </>;
  const colorSelector = <>
    <div className="sm:col-span-2">
      <span className="mb-2 block text-[11px] font-medium text-purple-100/75">{t("shared.demo.create.colorPalette")}</span>
      <CategoryColorPicker value={selectedColor} onChange={setSelectedColor} />
    </div>
  </>;
  const categoryPicker = (labelKey: string, placeholderKey: string, options: DemoCategoryChoice[], selectedId: string, onSelect: (choice: DemoCategoryChoice) => void, disabled = false) => (
    <div className="grid min-w-0 gap-1.5 text-[11px] font-medium text-purple-100/75">
      <span>{t(labelKey)}</span>
      <DemoCategoryPicker
        label={t(labelKey)}
        placeholder={t(placeholderKey)}
        options={options}
        selectedId={selectedId}
        onSelect={onSelect}
        onModalOpenChange={onModalOpenChange}
        disabled={disabled}
      />
    </div>
  );

  let fields: ReactNode;
  switch (kind) {
    case "expense":
      fields = <>
        {select("movementType", "shared.demo.create.type", simpleOptions({ value: "expense", label: t("shared.demo.create.expense") }, { value: "income", label: t("shared.demo.create.income") }))}
        {input("concept", "shared.demo.create.concept")}
        {input("amount", "shared.demo.create.amount", "number")}
        {select("currency", "shared.demo.create.currency", currencyChoices)}
        {input("date", "shared.demo.create.date", "date")}
        {select("account", "shared.demo.create.account", accountOptions)}
        {categoryPicker("shared.demo.create.category", "shared.demo.sample.category", categoryOptions, selectedCategoryId, (choice) => {
          setSelectedCategoryId(choice.id);
          update("category", choice.name);
          const nextSubcategory = [...DEMO_SUBCATEGORIES, ...DEMO_DEFAULT_SUBCATEGORIES].find((item) => item.categoryId === choice.id);
          setSelectedSubcategoryId(nextSubcategory?.id || "");
        })}
        {categoryPicker("shared.demo.create.subcategory", "shared.demo.create.subcategory", availableSubcategories, selectedSubcategoryId, (choice) => setSelectedSubcategoryId(choice.id), availableSubcategories.length === 0)}
        {input("tags", "shared.demo.create.tags", "text", "viaje, personal")}
        <PreviewField label={t("shared.demo.create.notes")} className="sm:col-span-2"><textarea className={previewControlClass} rows={2} value={values.note || ""} onChange={(event) => update("note", event.target.value)} /></PreviewField>
        <div className="sm:col-span-2 flex items-center gap-3 rounded-xl border border-dashed border-purple-200/20 bg-purple-400/5 px-3 py-3 text-[11px] text-purple-100/65"><IoDocumentAttachOutline size={18} aria-hidden="true" />{t("shared.demo.create.attachment")}<span className="ml-auto rounded-lg border border-white/10 px-2 py-1">+ {t("shared.demo.create.attachment")}</span></div>
      </>;
      break;
    case "transfer":
      fields = <>{input("concept", "movements.transfer.name", "text", "Transferencia entre cuentas")}{input("amount", "shared.demo.create.amount", "number")}{select("source", "shared.demo.create.origin", accountOptions)}{select("destination", "shared.demo.create.destination", accountOptions)}{input("date", "shared.demo.create.date", "date")}{select("currency", "shared.demo.create.currency", currencyChoices)}{input("note", "shared.demo.create.notes")}</>;
      break;
    case "account":
      fields = <>{input("accountName", "shared.demo.create.accountName")}{input("institution", "shared.demo.create.institution")}{select("accountType", "shared.demo.create.accountType", simpleOptions({ value: "debit", label: t("shared.demo.sample.accountType") }, { value: "cash", label: t("shared.demo.sample.cashAccount") }, { value: "credit", label: t("shared.demo.sample.creditAccount") }, { value: "multicurrency", label: t("shared.demo.sample.multicurrencyAccount") }))}{select("currency", "shared.demo.create.currency", currencyChoices)}{select("country", "shared.demo.create.country", simpleOptions({ value: t("shared.demo.profileSettings.countryMexico"), label: t("shared.demo.profileSettings.countryMexico") }, { value: t("shared.demo.profileSettings.countryUnitedStates"), label: t("shared.demo.profileSettings.countryUnitedStates") }, { value: t("shared.demo.profileSettings.countryJapan"), label: t("shared.demo.profileSettings.countryJapan") }))}{input("openingBalance", "shared.demo.create.openingBalance", "number")}</>;
      break;
    case "category":
      fields = <>{input("categoryName", "shared.demo.create.categoryName")}{select("categoryKind", "shared.demo.create.categoryKind", simpleOptions({ value: "category", label: t("shared.demo.sample.categoryOption") }, { value: "subcategory", label: t("shared.demo.sample.subcategoryOption") }))}{categoryPicker("shared.demo.create.parentCategory", "shared.demo.sample.category", categoryOptions, selectedParentCategoryId, (choice) => setSelectedParentCategoryId(choice.id))}{iconSelector}{colorSelector}</>;
      break;
    case "budget":
      fields = <>{input("budgetName", "shared.demo.create.budgetName")}{input("amount", "shared.demo.create.amount", "number")}{select("currency", "shared.demo.create.currency", currencyChoices)}{select("period", "shared.demo.create.period", simpleOptions({ value: "monthly", label: t("shared.demo.sample.period") }, { value: "yearly", label: t("shared.demo.sample.yearly") }, { value: "quarterly", label: t("shared.demo.sample.quarterly") }))}<div className="sm:col-span-2"><span className="mb-2 block text-[11px] font-medium text-purple-100/75">{t("shared.demo.create.category")}</span><div className="flex flex-wrap gap-2">{categoryOptions.map((category) => <button key={category.id} type="button" aria-pressed={selectedCategories.includes(category.id)} onClick={() => setSelectedCategories((current) => current.includes(category.id) ? current.filter((item) => item !== category.id) : [...current, category.id])} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${selectedCategories.includes(category.id) ? "border-purple-200/50 bg-purple-400/20 text-white" : "border-white/10 bg-black/15 text-purple-100/70 hover:bg-white/10"}`}><span className="grid h-5 w-5 place-items-center rounded-full" style={{ color: category.color }}><UniversalCategoIcon type={category.icon} siz={15} /></span>{category.name}</button>)}</div></div>{input("startDate", "shared.demo.create.startDate", "date")}{input("endDate", "shared.demo.create.endDate", "date")}</>;
      break;
    case "saving":
      fields = <>{input("goalName", "shared.demo.create.goalName")}{input("amount", "shared.demo.create.amount", "number")}{input("currentSaved", "shared.demo.create.savingCurrent", "number")}{select("currency", "shared.demo.create.targetCurrency", currencyChoices)}{input("targetDate", "shared.demo.create.targetDate", "date")}{select("account", "shared.demo.create.linkedAccount", accountOptions)}{select("period", "shared.demo.create.frequency", simpleOptions({ value: "monthly", label: t("shared.demo.sample.period") }, { value: "weekly", label: t("shared.demo.sample.weekly") }))}</>;
      break;
    case "project":
      fields = <>{input("projectName", "shared.demo.create.projectName")}{input("amount", "shared.demo.create.amount", "number")}{select("currency", "shared.demo.create.targetCurrency", currencyChoices)}{input("startDate", "shared.demo.create.startDate", "date")}{input("endDate", "shared.demo.create.endDate", "date")}{select("status", "shared.demo.create.status", simpleOptions({ value: "planned", label: t("shared.demo.sample.planned") }, { value: "quoting", label: t("shared.demo.sample.quoting") }, { value: "paid", label: t("shared.demo.sample.paid") }))}{input("tags", "shared.demo.create.tags", "text", "Japón, vacaciones")}{iconSelector}</>;
      break;
    case "excel":
      fields = null;
      break;
  }

  return <form onSubmit={(event) => event.preventDefault()} className="grid gap-3 sm:grid-cols-2" aria-label={t("shared.demo.createPreview")}>
    {kind === "excel" ? null : fields}
    <button type="submit" disabled className="sm:col-span-2 mt-1 min-h-10 cursor-not-allowed rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-semibold text-purple-100/55">{t("shared.demo.previewOnly")}</button>
  </form>;
}

export default function DemoCreateModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const [activeId, setActiveId] = useState<CreateOption["id"]>("expense");
  const [sampleCount, setSampleCount] = useState(1);
  const [nestedModalOpen, setNestedModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const active = options.find((option) => option.id === activeId) ?? options[0];

  useEffect(() => {
    setMounted(true);
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    lockBodyScroll();
    const focusFrame = requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>("[data-demo-autofocus]")?.focus());
    return () => {
      cancelAnimationFrame(focusFrame);
      unlockBodyScroll();
      previousFocusRef.current?.focus();
    };
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && !nestedModalOpen) onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [nestedModalOpen, onClose]);

  function trapFocus(event: KeyboardEvent<HTMLElement>) {
    if (nestedModalOpen || event.key !== "Tab" || !dialogRef.current) return;
    const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  if (!mounted) return null;

  const Icon = active.icon;
  return createPortal(
    <div
      className="fixed inset-0 z-[12000] flex items-center justify-center bg-black/65 p-3 backdrop-blur-md sm:p-5"
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <section
        ref={dialogRef}
        className="gf-glass-violet relative flex h-[min(820px,94dvh)] w-full max-w-[1060px] flex-col overflow-hidden rounded-3xl border border-white/15 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-create-title"
        tabIndex={-1}
        onKeyDown={trapFocus}
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-[.18em] text-purple-200">{t("shared.demo.createEyebrow")}</span>
            <h2 id="demo-create-title" className="mt-1 text-xl font-semibold text-white sm:text-2xl">{t("movements.help.create")}</h2>
          </div>
          <button type="button" data-demo-autofocus aria-label={t("movements.close")} onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 bg-white/5 text-purple-100 transition hover:bg-white/10 hover:text-white">
            <IoClose size={21} aria-hidden="true" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <nav aria-label={t("shared.demo.createOptions")} className="flex shrink-0 gap-2 overflow-x-auto border-b border-white/10 p-3 md:w-[250px] md:flex-col md:overflow-x-hidden md:overflow-y-auto md:border-b-0 md:border-r md:p-4">
            {options.map((option, index) => {
              const OptionIcon = option.icon;
              const selected = option.id === activeId;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setActiveId(option.id)}
                  data-demo-autofocus={index === 0 ? "true" : undefined}
                  className={`flex min-h-11 shrink-0 flex-col items-start gap-1.5 rounded-2xl border px-3 py-2.5 text-left transition md:w-full ${selected ? "border-purple-200/40 bg-purple-400/20 text-white shadow-[0_0_20px_rgba(168,85,247,.15)]" : "border-transparent text-purple-100/75 hover:border-white/10 hover:bg-white/5 hover:text-white"}`}
                >
                  <span className="flex items-center gap-3"><OptionIcon size={20} className="shrink-0" aria-hidden="true" /><span className="text-sm font-medium">{t(option.label)}</span></span>
                  <span className="pl-8 text-[10px] leading-relaxed text-purple-100/60">{t(option.summary)}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-purple-200/20 bg-purple-400/15 text-purple-100"><Icon size={22} aria-hidden="true" /></span>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-white sm:text-xl">{t(active.label)}</h3>
                <p className="mt-1 text-sm leading-relaxed text-purple-100/75">{t(active.help)}</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/15 p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-white">{t("shared.demo.createPreview")}</h4>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-purple-100/70">{t("shared.demo.previewOnly")}</span>
              </div>

              {active.id === "excel" ? (
                <div className="rounded-2xl border border-dashed border-purple-200/30 bg-purple-400/5 p-4 sm:p-6">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-purple-400/15 text-purple-100"><IoDocumentAttachOutline size={25} aria-hidden="true" /></div>
                  <p className="mt-3 text-center text-sm font-medium text-white">{t("shared.demo.importSampleFile")}</p>
                  <div className="mx-auto mt-4 flex w-fit items-center gap-3 rounded-full border border-white/10 bg-black/20 p-1.5">
                    <button type="button" disabled={sampleCount <= 1} onClick={() => setSampleCount((count) => Math.max(1, count - 1))} aria-label={t("shared.demo.decreaseSampleItems")} className="grid h-8 w-8 place-items-center rounded-full text-white hover:bg-white/10 disabled:opacity-40">−</button>
                    <span aria-live="polite" className="min-w-28 text-center text-xs text-purple-100">{t("shared.demo.sampleItemCount", { p1: sampleCount })}</span>
                    <button type="button" disabled={sampleCount >= 50} onClick={() => setSampleCount((count) => Math.min(50, count + 1))} aria-label={t("shared.demo.increaseSampleItems")} className="grid h-8 w-8 place-items-center rounded-full text-white hover:bg-white/10 disabled:opacity-40"><IoAdd size={19} aria-hidden="true" /></button>
                  </div>
                  <p className="mt-3 text-center text-[11px] text-purple-100/60">{t("shared.demo.batchLimit")}</p>
                </div>
              ) : <DemoCreateFields key={active.id} kind={active.id} onModalOpenChange={setNestedModalOpen} />}
            </div>

            <div className="mt-4 rounded-xl border border-rose-300/30 bg-rose-950/40 px-3.5 py-3 text-xs leading-relaxed text-rose-100">
              {t("shared.demo.createReadonly")}
            </div>

            <div className="mt-auto flex flex-col-reverse gap-2 pt-5 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-purple-100 transition hover:bg-white/5">{t("shared.cancel")}</button>
              <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-300 px-4 py-2.5 text-sm font-semibold text-purple-950 transition hover:bg-purple-200">{t("shared.demo.createAccount")} <IoAdd size={17} aria-hidden="true" /></Link>
            </div>
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}
