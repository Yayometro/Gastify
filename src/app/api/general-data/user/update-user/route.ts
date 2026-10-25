import { NextResponse, type NextRequest } from "next/server";
import dbConnection from "../../../dbConnection";
import User, { type IUser } from "@/model/User";
import { auth } from "@/lib/auth/betterAuth";
import { getVerifiedSession } from "@/lib/auth/requireVerifiedSession";
import { toPublicUser, type PublicUser } from "@/lib/auth/publicUser";
import { serverT } from "@/i18n/server";
import { isLocale } from "@gastify/core/i18n/locales";
import { normalizeCountry } from "@gastify/core/i18n/countries";
// export async function POST(request){
//     try{

//     } catch (e){
//     }
// }

export interface UpdateUserGetResponse {
  message: string;
  status: number;
  ok: boolean;
}

export interface UpdateUserRequestBody {
  fullName?: string;
  mail?: string;
  image?: string;
  phone?: string | number;
  password?: string;
  // The language of the account: "es" or "en", or null to follow where the person is.
  language?: string | null;
  // The country the person chose: an ISO code, or null to take it from where the phone or the network says they are.
  country?: string | null;
  [key: string]: unknown;
}

export interface UpdateUserSuccessResponse {
  message: string;
  data: PublicUser<IUser> | null;
  status: number;
  ok: boolean;
}

export type UpdateUserResponse = UpdateUserSuccessResponse;

export async function GET(): Promise<NextResponse<UpdateUserGetResponse>> {
  const t = await serverT(["errors"]);
  try {
    return NextResponse.json({
      message: t("errors.data.founded"),
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}

export async function POST(
  request: NextRequest | Request
): Promise<NextResponse<UpdateUserResponse>> {
  const t = await serverT(["errors"]);
  try {
    if (!request) throw new Error(t("errors.no.data.in.request.on"));
    const dataRequest: UpdateUserRequestBody = await request.json();
    let parsedPhone: number | undefined;
    // The phone number is personal data: it is deliberately never logged here.
    // A phone sent as a NUMBER used to be ignored (only strings were read, bug 2).
    if (typeof dataRequest.phone === "string" || typeof dataRequest.phone === "number") {
      parsedPhone = Number(dataRequest.phone);
    }
    // Security fix: this used to look up (and then update) the user by
    // whatever `mail` the client sent in the body, so ANY authenticated
    // caller could edit ANY OTHER user's fullName/mail/image/phone (an
    // IDOR - nothing verified the target email belonged to the caller's
    // own session; same underlying issue already fixed in get-user's
    // GET). The only real call site (ProfileClient.tsx) always sends the
    // caller's own profile, so deriving the target from the authenticated
    // session instead of trusting the body closes the hole with no change
    // to any legitimate caller's behavior. `dataRequest.mail` is still
    // honored below as the new email value being requested (changing your
    // own email is a legitimate feature) - only the lookup of WHICH user
    // to update no longer trusts the client.
    const sesion = await getVerifiedSession(request.headers);
    if (!sesion) throw new Error(t("errors.no.session"));
    await dbConnection();
    const userFounded = await User.findOne({ mail: sesion.user.email }).lean();
    if (!userFounded)
      throw new Error(t("errors.user.not.found.review.the"));

    // Credential logins are checked against the `account` collection now
    // (see src/lib/auth/betterAuth.js), not `User.password` - writing a
    // new hash there instead of here is what makes the new password
    // actually take effect on the next login. Uses the requester's own
    // session (forwarded via the request's cookies) rather than
    // Better Auth's self-service changePassword, which would also
    // require the current password - a UX change out of scope here.
    if (dataRequest.password) {
      await auth.api.setPassword({
        body: { newPassword: dataRequest.password },
        headers: request.headers,
      });
    }

    // const userUpdated = await userFounded.save();
    // The language of the account: only written when the request carries it (null means "where I am").
    const accountChange: { language?: string | null; country?: string | null } = {};
    if (dataRequest.language !== undefined) {
      if (dataRequest.language !== null && !isLocale(dataRequest.language)) throw new Error(t("errors.api.languageInvalid"));
      accountChange.language = dataRequest.language;
    }
    // The country: only written when the request carries it (null means "where I am"). An unknown code is refused.
    if (dataRequest.country !== undefined) {
      const country = dataRequest.country === null ? null : normalizeCountry(dataRequest.country);
      if (dataRequest.country !== null && !country) throw new Error(t("errors.api.countryInvalid"));
      accountChange.country = country;
    }

    const userUpdated = await User.findOneAndUpdate(
      { mail: userFounded.mail },
      {
        $set: {
          fullName: dataRequest.fullName || userFounded.fullName,
          mail: dataRequest.mail || userFounded.mail,
          image: dataRequest.image || userFounded.image,
          phone: parsedPhone || userFounded.phone,
          ...accountChange,
        },
      },
      { new: true } // Devuelve el documento modificado
    );

    if (!userUpdated) {
      throw new Error(t("errors.user.not.found.review.the"));
    }
    return NextResponse.json({
      message: t("errors.api.userUpdated", { p1: userFounded?.fullName || "" }),
      data: toPublicUser(userUpdated),
      status: 201,
      ok: true,
    });
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}