
import Account from "@/model/Account";
import Transaction from "@/model/Transaction";
import User from "@/model/User";
import dbConnection from "@/app/api/dbConnection";
import { NextResponse } from "next/server";
import { SUPPORTED_CURRENCIES, majorToMinor } from "@/lib/money/currencies";
import { auth } from "@/lib/auth/betterAuth";

export async function POST(request){
    try{
        if(!request) throw new Error("No data in request on UPDATE-ACCOUNT POST")
        const {accountId, name, amount, accountType, currency } = await request.json()
        // Security fix: this route had zero ownership/session check at all -
        // it took accountId straight from the client and updated whatever
        // Account matched, no matter who owned it. This endpoint isn't
        // covered by middleware.ts's matcher (dashboard pages only), so it
        // was reachable by ANY caller, authenticated or not. Now the caller's
        // own session resolves their wallet, and the lookup is scoped to an
        // account that actually belongs to it - an id for someone else's
        // account now fails the same "not found" check as a bogus id,
        // instead of silently updating it. The only real call site
        // (EditAccountModal.jsx) always edits the caller's own account.
        const sesion = await auth.api.getSession({ headers: request.headers });
        if (!sesion) throw new Error("No session");
        await dbConnection();
        const userFound = await User.findOne({ mail: sesion.user.email }).lean();
        if (!userFound) throw new Error("User not found on UPDATE-ACCOUNT POST");
        // FIND ACCOUNT
        const findAccount = await Account.findOne({ _id: accountId, wallet: userFound.wallet })
        //IF ERROR
            if(!findAccount) throw new Error(`No Account: ${name} was identified`)

        // Account currency cannot be changed once Transactions are linked to
        // it in this first implementation - the user must create a
        // correctly denominated Account instead.
        if (currency && currency !== findAccount.currency) {
            if (!SUPPORTED_CURRENCIES.includes(currency)) {
                throw new Error(`Unsupported currency: ${currency}`);
            }
            const linkedTransactionsCount = await Transaction.countDocuments({ account: accountId });
            if (linkedTransactionsCount > 0) {
                throw new Error(
                    `Cannot change currency: ${linkedTransactionsCount} transaction(s) are already linked to this account. Create a new account in the target currency instead.`
                );
            }
            findAccount.currency = currency;
        }

        findAccount.name = !name ? findAccount.name : name,
        findAccount.amount = !amount ? findAccount.amount : amount
        findAccount.accountType = !accountType ? findAccount.accountType : accountType
        findAccount.balanceMinor = majorToMinor(findAccount.amount || 0, findAccount.currency);
        findAccount.balanceUpdatedAt = new Date();
        const savedAccount = await findAccount.save();
        //IF ERROR
            if(!findAccount) throw new Error(`No Account: ${findAccount.name} was saved`)

        return NextResponse.json({
            message: `${savedAccount.name} updated successfully 🤓`,
            data: savedAccount,
            status: 201,
            ok: true
        })
    } catch(e){
        console.log(e)
        throw new Error(e)
    }
}