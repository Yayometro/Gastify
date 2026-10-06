import runNotify from "@/helpers/gastifyNotifier";
import { STEP_UP_REQUIRED_CODE } from "./factorChangePolicy";

// When the server refuses a factor change because the step-up is stale, send
// the user to /verify-2fa and bring them back to their profile afterwards.
// Returns true when it handled the error, so callers can just `return`.
export function redirectIfStepUpRequired(error: { code?: string; message?: string } | null | undefined): boolean {
  if (error?.code !== STEP_UP_REQUIRED_CODE) return false;
  runNotify("error", "Por seguridad, confirma tu identidad otra vez para continuar 🔒");
  window.location.assign("/verify-2fa?reauth=1&next=/dashboard/profile");
  return true;
}
