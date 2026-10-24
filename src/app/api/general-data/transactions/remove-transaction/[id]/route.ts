import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import dbConnection from "@/app/api/dbConnection";
import Transaction, { type ITransaction } from "@/model/Transaction";
import User from "@/model/User";
import { getVerifiedSession } from "@/lib/auth/requireVerifiedSession";
import { serverT } from "@/i18n/server";

const removeTransactionParamsSchema = z.object({
  id: z.string().min(1, "Transaction ID is required"),
});

export type RemoveTransactionParams = z.infer<
  typeof removeTransactionParamsSchema
>;

export interface RemoveTransactionSuccessResponse {
  message: string;
  data: ITransaction;
  status: number;
  ok: boolean;
}

export type RemoveTransactionResponse = RemoveTransactionSuccessResponse;

export async function POST(
  request: NextRequest | Request,
  context: { params: Promise<{ id?: string }> }
): Promise<NextResponse<RemoveTransactionResponse>> {
  const t = await serverT(["errors"]);
  try {
    if (!context || !context.params)
      throw new Error(t("errors.no.params.id.send.to"));
    const resolvedParams = await context.params;
    const parsedParams = removeTransactionParamsSchema.safeParse(resolvedParams);
    if (!parsedParams.success || !parsedParams.data.id)
      throw new Error(t("errors.no.params.id.send.to"));
    const { id } = parsedParams.data;

    // Security fix: this route previously lacked session verification and
    // performed Transaction.findByIdAndDelete(params.id) directly with zero ownership check (IDOR).
    // We now verify the caller's session via auth.api.getSession, find the
    // session user in the database, and scope the deletion query to the user's wallet.
    const sesion = await getVerifiedSession(request.headers);
    if (!sesion) throw new Error(t("errors.no.session"));

    await dbConnection();

    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound)
      throw new Error(t("errors.user.not.found.on.remove"));

    const removedTrans = await Transaction.findOneAndDelete({
      _id: id,
      wallet: userFound.wallet,
    });
    if (!removedTrans) throw new Error(t("errors.transaction.could.not.be.removed"));
    console.log(removedTrans);
    return NextResponse.json({
      message: `Transaction ${removedTrans.name} was removed 🤓`,
      data: removedTrans,
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e as string);
  }
}
