
import Account from "@/model/Account";
import Transaction from "@/model/Transaction";
import dbConnection from "@/app/api/dbConnection";
import { NextResponse } from "next/server";
import { SUPPORTED_CURRENCIES, majorToMinor } from "@/lib/money/currencies";

export async function POST(request){
    try{
        if(!request) throw new Error("No data in request on UPDATE-ACCOUNT POST")
        const {accountId, name, amount, accountType, currency } = await request.json()
        await dbConnection();
        // FIND ACCOUNT
        const findAccount = await Account.findById(accountId)
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