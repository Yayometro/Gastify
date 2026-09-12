import { NextResponse } from "next/server";
import dbConnection from "../dbConnection";
import { auth } from "@/lib/auth/betterAuth";

import User from "@/model/User";

// Manual (email/password) signup - creates the `user` + `account(credential)`
// pair via Better Auth's own signUpEmail API instead of hashing the
// password and constructing the User document by hand. This also fires
// `databaseHooks.user.create.after` (see src/lib/auth/betterAuth.js), which
// runs `provisionNewUserData` - the Wallet/Account/Category/SubCategory/Tag/
// Budget creation this route used to do inline, now shared with a user's
// first-ever OAuth (Google/GitHub) login too.
export async function POST(request) {
  try {
    await dbConnection();
    const dataFront = await request.json();

    const mailUsed = await User.findOne({ mail: dataFront.mail }).lean();
    if (mailUsed) {
      return NextResponse.json({
        error: `This mail(${mailUsed.mail}) is already registered with us. Please set up a new email account.`,
        errorUser: true,
      });
    }

    const { user } = await auth.api.signUpEmail({
      body: {
        name: dataFront.fullName,
        email: dataFront.mail,
        password: dataFront.password,
        image: dataFront.image || undefined,
      },
    });
    if (!user) throw new Error("No USER was saved creating a NEW USER ❌");

    return NextResponse.json({
      data: user,
      message: `New user "${dataFront.fullName}" was created successfully`,
      userCreatedStatus: true,
      status: 201,
    });
  } catch (e) {
    console.error(e);
    throw new Error(e);
  }
}
