import type { TourStep } from "../stepTypes";

// The cards every screen's tour of the phone starts with. The welcome says where the person is; the next two teach the help buttons,
// because the explanations of the app live in them: the compass opens a step-by-step tutorial of a section and the question mark
// explains what a number or a section means. They share one text on every screen.
export const mWelcome = (tour: string): TourStep => ({ id: `${tour}.welcome` });
export const mInfoTipStep = (tour: string): TourStep => ({ id: `${tour}.infoTip`, text: "mCommon.infoTip", anchor: "m-info-tip", optional: true, side: "bottom" });
export const mTutorialTipStep = (tour: string): TourStep => ({ id: `${tour}.tutorialTip`, text: "mCommon.tutorialTip", anchor: "m-tutorial-tip", optional: true, side: "bottom" });
