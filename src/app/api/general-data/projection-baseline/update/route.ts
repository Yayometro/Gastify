import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import dbConnection from "@/app/api/dbConnection";
import ProjectionBaseline, {
  type IProjectionBaseline,
  type IBaselineIncomeHistoryEntry,
  type IBaselineExpenseHistoryEntry,
} from "@/model/ProjectionBaseline";
import User from "@/model/User";
import Wallet from "@/model/Wallet";
import { majorToMinor, SUPPORTED_CURRENCIES } from "@/lib/money/currencies";
import { auth } from "@/lib/auth/betterAuth";

const updateProjectionBaselineBodySchema = z
  .object({
    mail: z.string().optional(),
    kind: z.union([z.literal("income"), z.literal("expense")]).or(z.string()).optional(),
    entryId: z.string().optional(),
    effectiveFrom: z.union([z.string(), z.date()]).optional(),
    effectiveTo: z.union([z.string(), z.date()]).nullable().optional(),
    amount: z.number().optional(),
    currency: z.string().optional(),
  })
  .passthrough();

export type UpdateProjectionBaselineRequestBody = z.infer<
  typeof updateProjectionBaselineBodySchema
>;

export interface UpdateProjectionBaselineStatusResponse {
  mes: string;
}

export interface UpdateProjectionBaselineSuccessResponse {
  message: string;
  data: IProjectionBaseline;
  status: number;
  ok: boolean;
}

export type UpdateProjectionBaselineResponse =
  UpdateProjectionBaselineSuccessResponse;

export async function GET(): Promise<
  NextResponse<UpdateProjectionBaselineStatusResponse>
> {
  return NextResponse.json({ mes: "Work" });
}

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<UpdateProjectionBaselineResponse>> {
  try {
    if (!request)
      throw new Error("No data in request on UPDATE PROJECTION BASELINE POST");

    // Security fix: this used to trust whatever mail the client sent in the
    // body, letting any caller (this endpoint isn't covered by middleware.ts's
    // matcher) create/update another user's projection baseline entries -
    // an IDOR, same underlying issue already fixed in get-user/get-wallet/get-categories/
    // get-sub-categories/budget/get/income-sources/get/projections/get/projections/update.
    // We now verify the caller's session via auth.api.getSession and derive the user
    // from sesion.user.email.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");

    const rawBody = (await request.json()) || {};
    const parsed = updateProjectionBaselineBodySchema.safeParse(rawBody);
    const body: UpdateProjectionBaselineRequestBody = parsed.success
      ? parsed.data
      : (rawBody as UpdateProjectionBaselineRequestBody);
    const { kind, entryId, effectiveFrom, effectiveTo, amount, currency } = body;

    if (!effectiveFrom || !kind)
      throw new Error(
        `No mail/kind/effectiveFrom was provided to update the projection baseline 🤕`
      );
    if (kind !== "income" && kind !== "expense")
      throw new Error(`kind must be "income" or "expense" 🤕`);
    if (currency && !SUPPORTED_CURRENCIES.includes(currency))
      throw new Error(`Unsupported currency: ${currency} 🤕`);
    if (effectiveTo && new Date(effectiveTo) <= new Date(effectiveFrom))
      throw new Error(`effectiveTo must be after effectiveFrom 🤕`);

    await dbConnection();
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound)
      throw new Error(
        {
          error: "User not found, review the email provided in GENERAL-DATA POST",
        } as unknown as string
      );
    const userId = userFound._id;
    const walletId = userFound.wallet;
    const parentWallet = (await (
      Wallet as unknown as {
        findById: (id: unknown) => {
          lean: () => Promise<{ primaryCurrency?: string } | null>;
        };
      }
    )
      .findById(walletId)
      .lean()) as { primaryCurrency?: string } | null;

    // Each entry keeps whatever currency the user actually earned/spent it
    // in (e.g. a USD paycheck) - defaults to the Wallet's primary currency
    // when not specified. Converting to primary currency for the math
    // happens client-side at read time, same as Income Sources already do.
    const entryCurrency = currency || parentWallet?.primaryCurrency || "MXN";

    let baseline = await ProjectionBaseline.findOne({ wallet: walletId });
    if (!baseline) {
      baseline = new ProjectionBaseline({
        user: userId,
        wallet: walletId,
        incomeHistory: [],
        expenseHistory: [],
      });
    }

    // Income and expense are independent timelines - each entry only ever
    // touches its own array, so adding an expense guess never disturbs the
    // income timeline (and vice versa). When entryId is provided, edit that
    // entry in place instead of appending a new one - so fixing a typo
    // doesn't require deleting and re-adding.
    const field = kind === "income" ? "incomeHistory" : "expenseHistory";
    const moneyField = kind === "income" ? "incomeMoney" : "expenseMoney";
    baseline[field] = baseline[field] || [];
    const newValues = {
      effectiveFrom: new Date(effectiveFrom),
      effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
      [moneyField]: {
        amountMinor: majorToMinor(amount || 0, entryCurrency),
        currency: entryCurrency,
      },
    };
    if (entryId) {
      const existing = (
        baseline[field] as Array<{ _id?: unknown }>
      ).find((entry) => String(entry._id) === String(entryId));
      if (!existing)
        throw new Error(
          `No ${kind} baseline entry was found with that id to edit 🤕`
        );
      Object.assign(existing, newValues);
    } else {
      (
        baseline[field] as Array<
          IBaselineIncomeHistoryEntry | IBaselineExpenseHistoryEntry
        >
      ).push(
        newValues as
          | IBaselineIncomeHistoryEntry
          | IBaselineExpenseHistoryEntry
      );
    }
    const savedBaseline = await baseline.save();

    if (!savedBaseline)
      throw new Error("Projection Baseline was not saved 🤕");
    return NextResponse.json({
      message: `Projection Baseline was updated successfully 🤓`,
      data: savedBaseline,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e as unknown as string);
  }
}
