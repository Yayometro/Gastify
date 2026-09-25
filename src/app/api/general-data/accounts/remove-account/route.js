
import Account from "@/model/Account";
import User from "@/model/User";
import dbConnection from "@/app/api/dbConnection";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/betterAuth";

export async function POST(request){
    try{
        if(!request) throw new Error("No data in request on REMOVE-ACCOUNT POST")
        const accountId = await request.json()
        // Security fix: this route had zero ownership/session check - it
        // deleted whatever Account matched accountId, no matter who owned
        // it, and this endpoint isn't covered by middleware.ts's matcher
        // (dashboard pages only), so it was reachable - and could delete any
        // account in the database - by ANY caller, authenticated or not.
        // Now deletion is scoped to an account that actually belongs to the
        // caller's own session/wallet. The only real call site
        // (EditAccountModal.jsx) always removes the caller's own account.
        const sesion = await auth.api.getSession({ headers: request.headers });
        if (!sesion) throw new Error("No session");
        await dbConnection();
        const userFound = await User.findOne({ mail: sesion.user.email }).lean();
        if (!userFound) throw new Error("User not found on REMOVE-ACCOUNT POST");
        // FIND ACCOUNT
        const removedAccount = await Account.findOneAndDelete({ _id: accountId, wallet: userFound.wallet })
            //IF ERROR
            if(!removedAccount) throw new Error(`No Account was identified to be removed`)

        return NextResponse.json({
            message: `${removedAccount.name} removed successfully 🤓`,
            data: removedAccount,
            status: 201,
            ok: true
        })
    } catch(e){
        console.log(e)
        throw new Error(e)
    }
}