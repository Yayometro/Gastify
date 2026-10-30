import { infoTipStep, tutorialTipStep, welcome, type TourStep } from "../stepTypes";

// Most of the tutorials point at the list of categories, which is the second tab of the page: this card presses the tab for the
// person (their Next) and is skipped when the list is already open.
const listTab = (id: string): TourStep => ({ id, text: "catTabs.list", anchor: "cat-tab-list", clickToContinue: true, skipIf: "cat-search", side: "bottom" });

// The categories page. Its own tour goes from the top down, one card per section; the tutorials below explain each section in depth.
// The form to create a category opens in a window from the "Create new" button: its tutorial presses it.
export const categoriesTours = {
  page: [
    welcome("categories"),
    tutorialTipStep("categories"),
    infoTipStep("categories"),
    { id: "categories.tabs", anchor: "cat-tabs", optional: true, side: "bottom" },
    { id: "categories.analyzer", anchor: "cat-an-selector", optional: true, side: "bottom" },
    { ...listTab("categories.listTab") },
    { id: "categories.create", anchor: "cat-create", optional: true, side: "bottom" },
    { id: "categories.search", anchor: "cat-search", side: "bottom" },
    { id: "categories.yours", anchor: "cat-yours", side: "bottom" },
    { id: "categories.yoursSub", anchor: "cat-yours-sub", side: "top" },
    { id: "categories.defaults", anchor: "cat-defaults", side: "top" },
    { id: "categories.defaultsSub", anchor: "cat-defaults-sub", side: "top" },
  ] satisfies readonly TourStep[],
  components: {
    // From the "Create new" button: press it, then the form.
    catCreate: [
      listTab("catCreate.listTab"),
      { id: "catCreate.open", anchor: "cat-create", clickToContinue: true, skipIf: "cat-form", side: "bottom" },
      { id: "catCreate.name", anchor: "cat-form-name", later: true, side: "left" },
      { id: "catCreate.color", anchor: "cat-form-color", later: true, side: "left" },
      { id: "catCreate.icon", anchor: "cat-form-icon", later: true, side: "left" },
      { id: "catCreate.sub", anchor: "cat-form-sub", later: true, side: "left" },
      { id: "catCreate.father", anchor: "cat-form-father", later: true, side: "left" },
      { id: "catCreate.submit", anchor: "cat-form-submit", later: true, side: "left" },
    ],
    catYours: [
      listTab("catYours.listTab"),
      { id: "catYours.what", anchor: "cat-yours", side: "bottom" },
      { id: "catYours.tile", anchor: "cat-tile", optional: true, side: "bottom" },
      { id: "catYours.subs", anchor: "cat-yours-sub", side: "top" },
      { id: "catYours.subTile", anchor: "cat-tile-sub", optional: true, side: "bottom" },
    ],
    // The analyzer of one category (the first tab): pick a category and read it block by block.
    catAnalyzer: [
      { id: "catAnalyzer.tab", text: "catTabs.analyzer", anchor: "cat-tab-analyzer", clickToContinue: true, skipIf: "cat-an-selector", side: "bottom" },
      { id: "catAnalyzer.selector", anchor: "cat-an-selector", later: true, side: "bottom" },
      { id: "catAnalyzer.bars", anchor: "cat-an-bars", optional: true, side: "top" },
      { id: "catAnalyzer.tags", anchor: "cat-an-tags", optional: true, side: "top" },
      { id: "catAnalyzer.subs", anchor: "cat-an-subs", optional: true, side: "top" },
      { id: "catAnalyzer.top", anchor: "cat-an-top", optional: true, side: "top" },
      { id: "catAnalyzer.list", anchor: "cat-an-list", optional: true, side: "top" },
    ],
    // Personas: add someone (the first card presses the button, which opens the questions), the cards and the comparison.
    peopleList: [
      { id: "peopleList.add", anchor: "people-add", clickToContinue: true, skipIf: "people-wizard", side: "bottom" },
      { id: "peopleList.wizard", anchor: "people-wizard", later: true, waitMs: 800, side: "left" },
      { id: "peopleList.cards", anchor: "people-list", optional: true, later: true, side: "top" },
      { id: "peopleList.compare", anchor: "people-compare", optional: true, later: true, side: "top" },
    ],
    catDefaults: [
      listTab("catDefaults.listTab"),
      { id: "catDefaults.what", anchor: "cat-defaults", side: "top" },
      { id: "catDefaults.tile", anchor: "cat-tile-default", optional: true, side: "bottom" },
      { id: "catDefaults.subs", anchor: "cat-defaults-sub", side: "top" },
    ],
  } satisfies Record<string, readonly TourStep[]>,
};
