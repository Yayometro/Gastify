import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import dbConnection from "@/app/api/dbConnection";
import ProjectionBaseline, {
  type IProjectionBaseline,
  type IBaselineIncomeHistoryEntry,
  type IBaselineExpenseHistoryEntry,
} from "@/model/ProjectionBaseline";
import User from "@/model/User";
import { auth } from "@/lib/auth/betterAuth";

const deleteProjectionBaselineBodySchema = z
  .object({
    mail: z.string().optional(),
    kind: z.union([z.literal("income"), z.literal("expense")]).or(z.string()).optional(),
    entryId: z.string().optional(),
  })
  .passthrough();

export type DeleteProjectionBaselineRequestBody = z.infer<
  typeof deleteProjectionBaselineBodySchema
>;

export interface DeleteProjectionBaselineStatusResponse {
  mes: string;
}

export interface DeleteProjectionBaselineSuccessResponse {
  message: string;
  data: IProjectionBaseline;
  status: number;
  ok: boolean;
}

export type DeleteProjectionBaselineResponse =
  DeleteProjectionBaselineSuccessResponse;

export async function GET(): Promise<
  NextResponse<DeleteProjectionBaselineStatusResponse>
> {
  return NextResponse.json({ mes: "Work" });
}

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<DeleteProjectionBaselineResponse>> {
  try {
    if (!request)
      throw new Error("No data in request on DELETE PROJECTION BASELINE POST");

    // Security fix: this used to trust whatever mail the client sent in the
    // body, letting any caller (this endpoint isn't covered by middleware.ts's
    // matcher) delete another user's projection baseline entries - an IDOR,
    // same underlying issue already fixed across the app (fix #39).
    // We now verify the caller's session via auth.api.getSession and derive the user
    // from sesion.user.email.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");

    const rawBody = (await request.json()) || {};
    const parsed = deleteProjectionBaselineBodySchema.safeParse(rawBody);
    const body: DeleteProjectionBaselineRequestBody = parsed.success
      ? parsed.data
      : (rawBody as DeleteProjectionBaselineRequestBody);
    const { kind, entryId } = body;

    if (!entryId || !kind)
      throw new Error(
        `No mail/kind/entryId was provided to delete a projection baseline entry 🤕`
      );
    if (kind !== "income" && kind !== "expense")
      throw new Error(`kind must be "income" or "expense" 🤕`);

    await dbConnection();
    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound)
      throw new Error(
        {
          error: "User not found, review the email provided in GENERAL-DATA POST",
        } as unknown as string
      );
    const walletId = userFound.wallet;

    const baseline = await ProjectionBaseline.findOne({ wallet: walletId });
    if (!baseline)
      throw new Error(
        "Projection Baseline was not found to delete an entry from 🤕"
      );
    const field = kind === "income" ? "incomeHistory" : "expenseHistory";
    baseline[field] = (
      (baseline[field] as Array<
        (IBaselineIncomeHistoryEntry | IBaselineExpenseHistoryEntry) & {
          _id?: unknown;
        }
      >) || []
    ).filter(
      (entry) => String(entry._id) !== String(entryId)
    ) as (IBaselineIncomeHistoryEntry & IBaselineExpenseHistoryEntry)[];
    const savedBaseline = await baseline.save();

    if (!savedBaseline)
      throw new Error("Projection Baseline was not saved 🤕");
    return NextResponse.json({
      message: `Projection Baseline entry was removed 🤓`,
      data: savedBaseline,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e as unknown as string);
  }
}
