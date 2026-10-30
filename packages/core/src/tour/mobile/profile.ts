import type { TourStep } from "../stepTypes";
import { mInfoTipStep, mTutorialTipStep, mWelcome } from "./helpers";

// The profile, card by card in the order they appear.
// Its in-depth tutorials, one per component, are listed in `components`.
export const profileTours = {
  page: [
    mWelcome("mProfile"),
    mTutorialTipStep("mProfile"),
    mInfoTipStep("mProfile"),
    { id: "mProfile.header", anchor: "m-prof-header", side: "bottom" },
    { id: "mProfile.data", anchor: "m-prof-data", side: "bottom" },
    { id: "mProfile.access", anchor: "m-prof-access", optional: true, side: "bottom" },
    { id: "mProfile.currency", anchor: "m-prof-currency", optional: true, side: "bottom" },
    { id: "mProfile.appearance", anchor: "m-prof-appearance", optional: true, side: "bottom" },
    { id: "mProfile.language", anchor: "m-prof-language", optional: true, side: "bottom" },
    { id: "mProfile.country", anchor: "m-prof-country", optional: true, side: "bottom" },
    { id: "mProfile.account", anchor: "m-prof-account", optional: true, side: "top" },
    { id: "mProfile.twoFactor", anchor: "m-prof-twofactor", optional: true, side: "top" },
    { id: "mProfile.passkeys", anchor: "m-prof-passkeys", optional: true, side: "top" },
    { id: "mProfile.tokens", anchor: "m-prof-tokens", optional: true, side: "top" },
    { id: "mProfile.tutorial", anchor: "m-prof-tutorial", optional: true, side: "top" },
    { id: "mProfile.signOut", anchor: "m-prof-signout", optional: true, side: "top" },
    { id: "mProfile.delete", anchor: "m-prof-delete", optional: true, side: "top" },
  ] satisfies readonly TourStep[],
  components: {
    "m-prof-header": [{ id: "m-prof-header.what", anchor: "m-prof-header", side: "bottom" }],
    "m-prof-data": [{ id: "m-prof-data.what", anchor: "m-prof-data", side: "bottom" }],
    "m-prof-access": [{ id: "m-prof-access.what", anchor: "m-prof-access", side: "bottom" }],
    "m-prof-currency": [{ id: "m-prof-currency.what", anchor: "m-prof-currency", side: "bottom" }],
    "m-prof-appearance": [{ id: "m-prof-appearance.what", anchor: "m-prof-appearance", side: "bottom" }],
    "m-prof-language": [{ id: "m-prof-language.what", anchor: "m-prof-language", side: "bottom" }],
    "m-prof-country": [{ id: "m-prof-country.what", anchor: "m-prof-country", side: "bottom" }],
    "m-prof-account": [{ id: "m-prof-account.what", anchor: "m-prof-account", side: "bottom" }],
    "m-prof-twofactor": [{ id: "m-prof-twofactor.what", anchor: "m-prof-twofactor", side: "bottom" }],
    "m-prof-passkeys": [{ id: "m-prof-passkeys.what", anchor: "m-prof-passkeys", side: "bottom" }],
    "m-prof-tokens": [{ id: "m-prof-tokens.what", anchor: "m-prof-tokens", side: "bottom" }],
    "m-prof-delete": [{ id: "m-prof-delete.what", anchor: "m-prof-delete", side: "bottom" }],
  } satisfies Record<string, readonly TourStep[]>,
};
