import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "@/app/api/dbConnection";
import User from "@/model/User";
import Category from "@/model/Category";
import SubCategory from "@/model/SubCategory";
import Account from "@/model/Account";
import Wallet from "@/model/Wallet";
import { createTranslator } from "@gastify/core/i18n/translate";
import { TEMPLATE_VERSION } from "@/lib/files/gastifyTemplate";
import { buildGastifyTemplate } from "@/lib/files/templateWorkbook";
import { getVerifiedSession } from "@/lib/auth/requireVerifiedSession";
import { currentLocale, messagesFor, serverT } from "@/i18n/server";

export interface TemplateErrorResponse {
  error?: string;
  ok: false;
}

export async function GET(
  request: NextRequest | Request
): Promise<NextResponse | Response> {
  const t = await serverT(["errors"]);
  try {
    // Security fix: this route previously lacked session authentication and trusted
    // params.email from the URL to fetch user accounts, categories, and wallet config (IDOR).
    // We now verify auth.api.getSession, resolve user identity exclusively from the session,
    // and query categories, subcategories, accounts, and wallet scoped to the session user.
    const sesion = await getVerifiedSession(request.headers);
    if (!sesion) throw new Error(t("errors.no.session"));

    await dbConnection();

    const userFound = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFound) throw new Error(t("errors.user.not.found.for.template"));

    const [categories, subCategories, accounts, wallet] = await Promise.all([
      Category.find({
        $or: [{ user: userFound._id }, { isDefaultCatego: true }],
      }).lean(),
      SubCategory.find({
        $or: [{ user: userFound._id }, { isDefaultSubCatego: true }],
      }).lean(),
      Account.find({ user: userFound._id, wallet: userFound.wallet }).lean(),
      Wallet.findById(userFound.wallet).lean(),
    ]);

    // The template is written in the person's language: the one saved on their account, else the one their browser chose,
    // else the country and the browser's language (the same order as the pages).
    const locale = await currentLocale(sesion.user.language, sesion.user.country);
    const tt = createTranslator(locale, await messagesFor(locale, ["errors", "template"]));

    const buffer = await buildGastifyTemplate(tt, {
      categories: categories.map((c) => c.name).filter(Boolean),
      subCategories: subCategories.map((s) => s.name).filter(Boolean),
      accounts: accounts.map((a) => a.name).filter(Boolean),
      primaryCurrency: wallet?.primaryCurrency || "MXN",
    });

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="gastify-template-v${TEMPLATE_VERSION}-${locale}.xlsx"`,
      },
    });
  } catch (e) {
    console.log(e);
    return NextResponse.json({ error: (e as Error).message, ok: false }, { status: 500 });
  }
}
