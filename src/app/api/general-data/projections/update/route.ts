import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import dbConnection from "@/app/api/dbConnection";
import ProjectionSettings, {
  type IProjectionSettings,
  type IMonthlyBufferRevision,
  type IMonthlyBalanceRevision,
} from "@/model/ProjectionSettings";
import User from "@/model/User";
import Wallet from "@/model/Wallet";
import { majorToMinor } from "@/lib/money/currencies";
import { auth } from "@/lib/auth/betterAuth";

const monthBufferSchema = z
  .object({
    month: z.number().optional(),
    unexpectedBuffer: z.number().optional(),
    unexpectedIncomeBuffer: z.number().optional(),
  })
  .passthrough();

const monthBalanceSchema = z
  .object({
    month: z.number().optional(),
    balance: z.number().optional(),
  })
  .passthrough();

const updateProjectionSettingsBodySchema = z
  .object({
    mail: z.string().optional(),
    year: z.union([z.number(), z.string()]).optional(),
    monthBuffer: monthBufferSchema.optional(),
    monthBalance: monthBalanceSchema.optional(),
  })
  .passthrough();

export type MonthBufferInput = z.infer<typeof monthBufferSchema>;
export type MonthBalanceInput = z.infer<typeof monthBalanceSchema>;
export type UpdateProjectionSettingsRequestBody = z.infer<
  typeof updateProjectionSettingsBodySchema
>;

export interface UpdateProjectionSettingsStatusResponse {
  mes: string;
}

export interface UpdateProjectionSettingsSuccessResponse {
  message: string;
  data: IProjectionSettings;
  status: number;
  ok: boolean;
}

export type UpdateProjectionSettingsResponse =
  UpdateProjectionSettingsSuccessResponse;

export async function GET(): Promise<
  NextResponse<UpdateProjectionSettingsStatusResponse>
> {
  return NextResponse.json({ mes: "Work" });
}

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<UpdateProjectionSettingsResponse>> {
  try {
    if (!request)
      throw new Error("No data in request on UPDATE PROJECTION SETTINGS POST");
    // Security fix: this used to trust whatever mail the client sent in the
    // body, letting any caller (this endpoint isn't covered by middleware.ts's
    // matcher) update another user's projection settings (monthly buffers and balances) -
    // an IDOR, same underlying issue already fixed in get-user/get-wallet/get-categories/
    // get-sub-categories/budget/get/income-sources/get/projections/get.
    // We now verify the caller's session via auth.api.getSession and derive the user
    // from sesion.user.email.
    const sesion = await auth.api.getSession({ headers: request.headers });
    if (!sesion) throw new Error("No session");

    const rawBody = (await request.json()) || {};
    const parsed = updateProjectionSettingsBodySchema.safeParse(rawBody);
    const body: UpdateProjectionSettingsRequestBody = parsed.success
      ? parsed.data
      : (rawBody as UpdateProjectionSettingsRequestBody);
    const { year, monthBuffer, monthBalance } = body;
    if (!year)
      throw new Error(
        `No mail/year was provided to update projection settings 🤕`
      );
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
    // New manual entries are stamped with the Wallet's primary currency at
    // the moment they're saved (plan section 7.6) - this never changes
    // retroactively if the Wallet's primary currency changes later, unlike
    // the legacy MXN-implicit fields kept alongside for the transition.
    const walletPrimaryCurrency = parentWallet?.primaryCurrency || "MXN";

    // GET-OR-CREATE: one settings document per wallet+year
    let settings = await ProjectionSettings.findOne({ wallet: walletId, year });
    if (!settings) {
      settings = new ProjectionSettings({ user: userId, wallet: walletId, year });
    }
    // only touch fields that were actually sent, so one field's update
    // (e.g. monthBalance) doesn't silently reset the others to their default
    if (monthBuffer && monthBuffer.month !== undefined) {
      settings.monthlyBuffers = settings.monthlyBuffers || [];
      const expenseMoney = {
        amountMinor: majorToMinor(
          monthBuffer.unexpectedBuffer || 0,
          walletPrimaryCurrency
        ),
        currency: walletPrimaryCurrency,
      };
      const incomeMoney = {
        amountMinor: majorToMinor(
          monthBuffer.unexpectedIncomeBuffer || 0,
          walletPrimaryCurrency
        ),
        currency: walletPrimaryCurrency,
      };
      const updatedAt = new Date();
      const revision: IMonthlyBufferRevision = {
        unexpectedBuffer: monthBuffer.unexpectedBuffer,
        unexpectedIncomeBuffer: monthBuffer.unexpectedIncomeBuffer,
        expenseMoney,
        incomeMoney,
        updatedAt,
      };
      const existing = settings.monthlyBuffers.find(
        (m) => m.month === monthBuffer.month
      );
      if (existing) {
        existing.unexpectedBuffer = monthBuffer.unexpectedBuffer;
        existing.unexpectedIncomeBuffer = monthBuffer.unexpectedIncomeBuffer;
        existing.expenseMoney = expenseMoney;
        existing.incomeMoney = incomeMoney;
        existing.revisions = existing.revisions || [];
        existing.revisions.push(revision);
      } else {
        settings.monthlyBuffers.push({
          month: monthBuffer.month,
          unexpectedBuffer: monthBuffer.unexpectedBuffer,
          unexpectedIncomeBuffer: monthBuffer.unexpectedIncomeBuffer,
          expenseMoney,
          incomeMoney,
          revisions: [revision],
        });
      }
    }
    if (monthBalance && monthBalance.month !== undefined) {
      settings.monthlyBalances = settings.monthlyBalances || [];
      const money = {
        amountMinor: majorToMinor(
          monthBalance.balance || 0,
          walletPrimaryCurrency
        ),
        currency: walletPrimaryCurrency,
      };
      const updatedAt = new Date();
      const revision: IMonthlyBalanceRevision = {
        balance: monthBalance.balance,
        money,
        updatedAt,
      };
      const existing = settings.monthlyBalances.find(
        (m) => m.month === monthBalance.month
      );
      if (existing) {
        existing.balance = monthBalance.balance;
        existing.money = money;
        existing.revisions = existing.revisions || [];
        existing.revisions.push(revision);
      } else {
        settings.monthlyBalances.push({
          month: monthBalance.month,
          balance: monthBalance.balance,
          money,
          revisions: [revision],
        });
      }
    }
    const savedSettings = await settings.save();

    if (!savedSettings)
      throw new Error("Projection Settings were not saved 🤕");
    return NextResponse.json({
      message: `Projection Settings were updated successfully 🤓`,
      data: savedSettings,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e as unknown as string);
  }
}
