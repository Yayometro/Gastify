
import Account from "@/model/Account";
import Wallet from "@/model/Wallet";
import dbConnection from "@/app/api/dbConnection";
import { NextResponse } from "next/server";
import { SUPPORTED_CURRENCIES, majorToMinor } from "@/lib/money/currencies";

export async function POST(request){
    try{
        if(!request) throw new Error("No data in request on NEW-ACCOUNT POST")
        const {userId, walletId, name, amount, accountType, currency } = await request.json()
        await dbConnection();
        //
        // New Account currency defaults to the Wallet's primary currency
        // when not explicitly chosen.
        let resolvedCurrency = currency;
        if (!resolvedCurrency) {
            const parentWallet = await Wallet.findById(walletId).lean();
            resolvedCurrency = parentWallet?.primaryCurrency || "MXN";
        }
        if (!SUPPORTED_CURRENCIES.includes(resolvedCurrency)) {
            throw new Error(`Unsupported currency: ${resolvedCurrency}`);
        }
        const resolvedAmount = !amount ? 0 : amount;
        //
        const newAccount = new Account({
            user: userId,
            wallet: walletId,
            name: !name ? "Account nameless" : name,
            amount: resolvedAmount,
            accountType: !accountType ? "debit" : accountType,
            currency: resolvedCurrency,
            balanceMinor: majorToMinor(resolvedAmount, resolvedCurrency),
            balanceUpdatedAt: new Date(),
        })
        const savedAccount = await newAccount.save();
            if(!savedAccount) throw new Error(`No Account: ${newAccount.name} was saved`)

        return NextResponse.json({
            message: `${newAccount.name} created successfully 🤓`,
            data: savedAccount,
            status: 201,
            ok: true
        })
    } catch(e){
        console.log(e)
        throw new Error(e)
    }
}