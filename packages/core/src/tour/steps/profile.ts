import { infoTipStep, openPanelStep, tutorialTipStep, welcome, type TourStep } from "../stepTypes";

// The profile page. Its own tour goes card by card in the order the cards appear; the tutorials below explain each card in depth.
// The panels of passkeys, two-step verification and tokens are collapsed until their title is pressed: their tutorials open them.
const openPanel = openPanelStep;

export const profileTours = {
  page: [
    welcome("profile"),
    tutorialTipStep("profile"),
    infoTipStep("profile"),
    { id: "profile.header", anchor: "prof-header", side: "bottom" },
    { id: "profile.data", anchor: "prof-data", optional: true, side: "bottom" },
    { id: "profile.access", anchor: "prof-access", optional: true, side: "bottom" },
    { id: "profile.language", anchor: "prof-language", optional: true, side: "bottom" },
    { id: "profile.country", anchor: "prof-country", optional: true, side: "bottom" },
    { id: "profile.account", anchor: "prof-account", optional: true, side: "bottom" },
    { id: "profile.passkeys", anchor: "prof-passkeys", optional: true, side: "bottom" },
    { id: "profile.twoFactor", anchor: "prof-twofactor", optional: true, side: "bottom" },
    { id: "profile.ai", anchor: "prof-ai", optional: true, side: "bottom" },
    { id: "profile.tutorial", anchor: "prof-tutorial", optional: true, side: "top" },
    { id: "profile.signOut", anchor: "prof-signout", optional: true, side: "top" },
    { id: "profile.delete", anchor: "prof-delete", optional: true, side: "top" },
  ] satisfies readonly TourStep[],
  components: {
    profData: [
      { id: "profData.name", anchor: "prof-data-name", side: "bottom" },
      { id: "profData.phone", anchor: "prof-data-phone", side: "bottom" },
      { id: "profData.save", anchor: "prof-data-save", side: "top" },
    ],
    profAccess: [
      { id: "profAccess.mail", anchor: "prof-access-mail", side: "bottom" },
      { id: "profAccess.password", anchor: "prof-access-password", side: "top" },
    ],
    profLanguage: [{ id: "profLanguage.options", anchor: "prof-language-options", side: "bottom" }],
    profCountry: [{ id: "profCountry.select", anchor: "prof-country-select", side: "bottom" }],
    profPasskeys: [
      { id: "profPasskeys.what", anchor: "prof-passkeys-header", side: "bottom" },
      openPanel("profPasskeys", "prof-passkeys-header", "prof-passkeys-body"),
      { id: "profPasskeys.list", anchor: "prof-passkeys-list", side: "bottom", later: true },
      { id: "profPasskeys.add", anchor: "prof-passkeys-form", side: "top", later: true },
    ],
    profTwoFactor: [
      { id: "profTwoFactor.what", anchor: "prof-twofactor-header", side: "bottom" },
      openPanel("profTwoFactor", "prof-twofactor-header", "prof-twofactor-body"),
      { id: "profTwoFactor.status", anchor: "prof-twofactor-status", side: "top", later: true },
    ],
    profTokens: [
      { id: "profTokens.what", anchor: "prof-tokens-header", side: "bottom" },
      openPanel("profTokens", "prof-tokens-header", "prof-tokens-body"),
      { id: "profTokens.list", anchor: "prof-tokens-list", side: "bottom", later: true },
      { id: "profTokens.form", anchor: "prof-tokens-form", side: "top", later: true },
    ],
    profDelete: [{ id: "profDelete.button", anchor: "prof-delete", side: "top" }],
  } satisfies Record<string, readonly TourStep[]>,
};
