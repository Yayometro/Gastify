import type { TourStep } from "../stepTypes";
import { mInfoTipStep, mTutorialTipStep, mWelcome } from "./helpers";

// The category form's fields. The subcategory ones show only while its switch is on, so the tutorial skips them otherwise.
const categoryForm: TourStep[] = [
  { id: "m-catform.name", anchor: "m-catform-name", side: "bottom" },
  { id: "m-catform.color", anchor: "m-catform-color", side: "top" },
  { id: "m-catform.icon", anchor: "m-catform-icon", side: "top" },
  { id: "m-catform.sub", anchor: "m-catform-sub", optional: true, side: "top" },
  { id: "m-catform.subname", anchor: "m-catform-subname", optional: true, side: "top" },
  { id: "m-catform.parent", anchor: "m-catform-parent", optional: true, side: "top" },
  { id: "m-catform.save", anchor: "m-catform-save", side: "top" },
];

// The sub-category form: the category it goes in comes first and is required.
const subCategoryForm: TourStep[] = [
  { id: "m-subform.parent", anchor: "m-subform-parent", side: "bottom" },
  { id: "m-subform.name", anchor: "m-subform-name", side: "bottom" },
  { id: "m-subform.color", anchor: "m-subform-color", side: "top" },
  { id: "m-subform.icon", anchor: "m-subform-icon", side: "top" },
  { id: "m-subform.save", anchor: "m-subform-save", side: "top" },
];

// The list of categories is the second tab of the screen: this card presses the tab for the person and is skipped when it is open.
const listTab = (id: string): TourStep => ({ id, text: "m-cattab.list", anchor: "m-cat-tab-list", clickToContinue: true, skipIf: "m-cat-search", side: "bottom" });

// The categories: search, create your own, the ones you made and the default catalog.
// Its in-depth tutorials, one per component, are listed in `components`.
export const categoriesTours = {
  page: [
    mWelcome("mCategories"),
    mTutorialTipStep("mCategories"),
    mInfoTipStep("mCategories"),
    { id: "mCategories.tabs", anchor: "m-cat-tabs", side: "bottom" },
    { id: "mCategories.analyzer", anchor: "m-cat-an-selector", optional: true, side: "bottom" },
    { id: "mCategories.search", anchor: "m-cat-search", optional: true, side: "bottom" },
    { id: "mCategories.new", anchor: "m-cat-new", optional: true, side: "bottom" },
    { id: "mCategories.newSub", anchor: "m-cat-newsub", optional: true, side: "bottom" },
    { id: "mCategories.yours", anchor: "m-cat-yours", optional: true, side: "bottom" },
    { id: "mCategories.defaults", anchor: "m-cat-defaults", optional: true, side: "top" },
  ] satisfies readonly TourStep[],
  components: {
    "m-cat-analyzer": [
      { id: "m-cat-analyzer.tab", text: "m-cattab.analyzer", anchor: "m-cat-tab-analyzer", clickToContinue: true, skipIf: "m-cat-an-selector", side: "bottom" },
      { id: "m-cat-analyzer.selector", anchor: "m-cat-an-selector", later: true, side: "bottom" },
      { id: "m-cat-analyzer.bars", anchor: "m-cat-an-bars", optional: true, side: "top" },
      { id: "m-cat-analyzer.tags", anchor: "m-cat-an-tags", optional: true, side: "top" },
      { id: "m-cat-analyzer.subs", anchor: "m-cat-an-subs", optional: true, side: "top" },
      { id: "m-cat-analyzer.top", anchor: "m-cat-an-top", optional: true, side: "top" },
      { id: "m-cat-analyzer.list", anchor: "m-cat-an-list", optional: true, side: "top" },
    ],
    "m-cat-search": [listTab("m-cat-search.tab"), { id: "m-cat-search.what", anchor: "m-cat-search", later: true, side: "bottom" }],
    "m-cat-new": [listTab("m-cat-new.tab"), { id: "m-cat-new.what", anchor: "m-cat-new", later: true, side: "bottom" }],
    "m-cat-newsub": [listTab("m-cat-newsub.tab"), { id: "m-cat-newsub.what", anchor: "m-cat-newsub", later: true, side: "bottom" }],
    "m-subform": subCategoryForm,
    "m-cat-yours": [listTab("m-cat-yours.tab"), { id: "m-cat-yours.what", anchor: "m-cat-yours", later: true, side: "bottom" }],
    "m-catform": categoryForm,
  } satisfies Record<string, readonly TourStep[]>,
};
