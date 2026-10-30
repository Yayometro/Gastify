import { NextResponse } from "next/server";
import dbConnection from "../../../dbConnection";
import User from "@/model/User";
import { getVerifiedSession } from "@/lib/auth/requireVerifiedSession";
import { serverT } from "@/i18n/server";
import {
  applyComplete,
  applyDismiss,
  applyProgress,
  applyVisit,
  autoActionFor,
  freshOnboarding,
  isStepOf,
  readOnboarding,
  type Onboarding,
  type OnboardingReply,
} from "@gastify/core/tour/onboarding";
import type { SectionTourId } from "@gastify/core/tour/tourSteps";

// What the account remembers about the guided tutorial (see packages/core/src/tour/onboarding.ts for the rules). The account is
// always the one in the verified session, never one named in the body. Every action only touches the `onboarding` field.
//   state     reads the record;
//   visit     a session opened: counts it once and answers what the app should do by itself;
//   progress  the last card shown;
//   complete  the full tour was finished;
//   dismiss   the person does not want the tutorial on its own;
//   announce  an account from before the tutorial was told about it.
const ACTIONS = ["state", "visit", "progress", "complete", "dismiss", "announce"] as const;
type OnboardingAction = (typeof ACTIONS)[number];

export interface OnboardingRequestBody {
  action?: unknown;
  tour?: unknown;
  step?: unknown;
}

export type OnboardingResponse = OnboardingReply;

function reply(status: number, body: OnboardingResponse): NextResponse<OnboardingResponse> {
  return NextResponse.json(body, { status });
}

export async function POST(request: Request): Promise<NextResponse<OnboardingResponse>> {
  const t = await serverT(["errors"]);
  let body: OnboardingRequestBody = {};
  try {
    const parsed: unknown = await request.json();
    // A body that is not an object (null, a number, a list) names no action: it is refused below like any unknown one.
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) body = parsed as OnboardingRequestBody;
  } catch {
    // Not JSON: same as an empty body.
  }
  const action = ACTIONS.find((candidate) => candidate === body.action) as OnboardingAction | undefined;
  if (!action) return reply(400, { ok: false, message: t("errors.no.data.in.request.on"), onboarding: null });

  const sesion = await getVerifiedSession(request.headers);
  if (!sesion?.user?.email) return reply(401, { ok: false, message: t("errors.no.session"), onboarding: null });

  await dbConnection();
  const doc = await User.findOne({ mail: sesion.user.email }).select("onboarding").lean();
  if (!doc) return reply(404, { ok: false, message: t("errors.user.not.found.review.the"), onboarding: null });
  const current = readOnboarding(doc.onboarding);

  // Writes the whole record. `expectSession` makes the write conditional on the session last counted, so two tabs that open the
  // same session at once cannot count it twice.
  const save = async (next: Onboarding, expectSession?: { lastSessionId: string | null }): Promise<boolean> => {
    const filter: Record<string, unknown> = { _id: doc._id };
    if (expectSession) filter["onboarding.lastSessionId"] = expectSession.lastSessionId;
    const result = await User.updateOne(filter, { $set: { onboarding: next } });
    return result.matchedCount === 1;
  };

  switch (action) {
    case "state":
      return reply(200, { ok: true, onboarding: current });

    case "visit": {
      // No record: an account from before the tutorial. It is told once; nothing is counted for it.
      if (!current) return reply(200, { ok: true, onboarding: null, action: autoActionFor(null) });
      const { next, isNewSession } = applyVisit(current, sesion.session.id);
      if (!isNewSession) return reply(200, { ok: true, onboarding: current, action: "none" });
      const saved = await save(next, { lastSessionId: current.lastSessionId });
      // Another tab counted this session first: nothing more to do here.
      if (!saved) return reply(200, { ok: true, onboarding: current, action: "none" });
      return reply(200, { ok: true, onboarding: next, action: autoActionFor(next) });
    }

    case "progress": {
      if (!isStepOf(body.tour, body.step)) return reply(400, { ok: false, message: t("errors.no.data.in.request.on"), onboarding: current });
      if (!current) return reply(200, { ok: true, onboarding: null });
      const next = applyProgress(current, { tour: body.tour as SectionTourId, step: body.step as string });
      if (next !== current) await save(next);
      return reply(200, { ok: true, onboarding: next });
    }

    case "complete": {
      if (!current) return reply(200, { ok: true, onboarding: null });
      const next = applyComplete(current);
      await save(next);
      return reply(200, { ok: true, onboarding: next });
    }

    case "dismiss": {
      const next = applyDismiss(current ?? freshOnboarding());
      await save(next);
      return reply(200, { ok: true, onboarding: next });
    }

    case "announce": {
      if (current) return reply(200, { ok: true, onboarding: current });
      const next = applyDismiss(freshOnboarding());
      await save(next);
      return reply(200, { ok: true, onboarding: next });
    }
  }
}
