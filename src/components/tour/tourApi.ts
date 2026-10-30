import fetcher from "@/helpers/fetcher";
import type { OnboardingReply } from "@gastify/core/tour/onboarding";

// What the tutorial tells the server about the signed-in account (see api/general-data/user/onboarding). The tutorial must never
// break the app, so a failed call is just null: the tour keeps working, it only does not remember.
export type OnboardingCall =
  | { action: "state" | "visit" | "complete" | "dismiss" | "announce" }
  | { action: "progress"; tour: string; step: string };

export async function callOnboarding(body: OnboardingCall): Promise<OnboardingReply | null> {
  try {
    const reply = await fetcher().post<OnboardingReply>("general-data/user/onboarding", body);
    return reply?.ok ? reply : null;
  } catch {
    return null;
  }
}
