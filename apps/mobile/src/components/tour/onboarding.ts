import { getApi } from '@gastify/core/api/client';
import type { OnboardingReply } from '@gastify/core/tour/onboarding';

// What the tutorial tells the server about the signed-in account (see api/general-data/user/onboarding), the same record the web uses,
// so a person who finished the tutorial on one device is not offered it again on the other. The tutorial must never break the app, so a
// failed call is just null: the tour keeps working, it only does not remember. The phone never sends `progress`: its screens are not
// the web's, so there is no card of the web's tour to resume.
type OnboardingCall = { action: 'state' | 'visit' | 'complete' | 'dismiss' | 'announce' };

export async function callOnboarding(body: OnboardingCall): Promise<OnboardingReply | null> {
  try {
    const reply = await getApi().post<OnboardingReply>('general-data/user/onboarding', body);
    return reply?.ok ? reply : null;
  } catch {
    return null;
  }
}
