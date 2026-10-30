import type tourAccounts from "../es/tourAccounts";

// English for the "tourAccounts" namespace. Same keys as the Spanish catalog.
const en: Record<keyof typeof tourAccounts, string> = {
  // The page tour: from the top down.
  "tour.accounts.welcome.title": "Your accounts",
  "tour.accounts.welcome.body": "All your accounts and cards in one place: their balance, what came in and went out of each one, and all their transactions. I will take you from top to bottom; next to every title there is a compass with its in-depth tutorial.",
  "tour.accounts.filters.title": "Choose the period",
  "tour.accounts.filters.body": "Sets the range used to calculate what came in and went out that you see on each card: a preset one (yesterday, last week, last 30 days…) or your own.",
  "tour.accounts.currency.title": "Main currency",
  "tour.accounts.currency.body": "The currency your totals and the equivalents of accounts in other currencies are shown in. Each account keeps its balance in its own currency.",
  "tour.accounts.cards.title": "Your cards",
  "tour.accounts.cards.body": "One card per account, with its balance and currency; if it is in another currency, also its equivalent in the main one. You can drag them to change their order.",
  "tour.accounts.detail.title": "An account's detail",
  "tour.accounts.detail.body": "The arrows switch accounts. Everything below (the summary and the transactions) refers to the account you are viewing.",
  "tour.accounts.actions.title": "Edit or create an account",
  "tour.accounts.actions.body": "“Edit account” changes the data of the account you are viewing and “New account” creates another one from scratch.",
  "tour.accounts.summary.title": "Movements summary",
  "tour.accounts.summary.body": "What came in and went out of this account, by category, just like your wallet's summary: the map, the bubbles or the ring on the left and the categories on the right. It uses its own period above; only this account's movements count.",
  "tour.accounts.top.title": "The account's top",
  "tour.accounts.top.body": "This account's biggest movements, of expenses and of income, in the period you choose in its own filter.",
  "tour.accounts.list.title": "Account movements",
  "tour.accounts.list.body": "The list of all this account's movements. Filter them by period, by type or by text, and tap one to see or edit it.",

  // The period.
  "tour.accPeriod.name": "Period",
  "tour.accPeriod.select.title": "Preset periods",
  "tour.accPeriod.select.body": "Choose yesterday, the last week or the last 15, 30, 60 or 90 days. It is the quickest way to change what the cards measure.",
  "tour.accPeriod.range.title": "Your own range",
  "tour.accPeriod.range.body": "If you need exact dates, pick the start day and the end day here. The range you set replaces the preset one.",

  // The cards.
  "tour.accCards.name": "Account cards",
  "tour.accCards.title.title": "Accounts summary",
  "tour.accCards.title.body": "One card per account, with its current balance in its own currency and, if it is in another currency, its approximate equivalent in your main one. What came in and went out are those of the period chosen above. Tap an account’s name to open its detail in Accounts, with its transactions and summary. Drag a card to change the order; the order is saved to your account.",
  "tour.accCards.strip.title": "Your cards",
  "tour.accCards.strip.body": "They are laid out in a row; scroll to see the rest. On your account you can drag a card to change its order, and the order is saved.",
  "tour.accCards.top.title": "Bank, name and type",
  "tour.accCards.top.body": "The bank's logo, the account's name and its type (debit, credit, cash or savings). Tapping the name takes you to that account's detail, further down.",
  "tour.accCards.balance.title": "Balance",
  "tour.accCards.balance.body": "The current balance in the account's own currency. If that currency is not the main one, its approximate equivalent in the main one appears below.",
  "tour.accCards.number.title": "Card number",
  "tour.accCards.number.body": "It only appears if you saved one. It is hidden by default; tap the eye to see it. Gastify never stores the CVV or the PIN.",
  "tour.accCards.flow.title": "What came in and went out",
  "tour.accCards.flow.body": "The up arrow is what came into the account in the period chosen above and the down arrow is what went out. It is not the balance: it is the period's movement.",

  // An account's detail.
  "tour.accDetail.name": "An account's detail",
  "tour.accDetail.carousel.title": "Switch accounts",
  "tour.accDetail.carousel.body": "The big name is the account you are viewing. The arrows move to the previous or the next one, and after the last you go back to the first. The summary and the transactions below follow the chosen account.",
  "tour.accDetail.edit.title": "Edit account",
  "tour.accDetail.edit.body": "It opens the form of the account you are viewing, with its data ready to change. “Remove account” is there too: use it carefully. An account that has transactions can no longer change its currency.",
  "tour.accDetail.new.title": "New account",
  "tour.accDetail.new.body": "It creates another account from scratch. The “Create an account” tutorial teaches you, field by field, how to fill it in.",

  // Create an account.
  "tour.accForm.name": "Create an account",
  "tour.accForm.open.title": "New account",
  "tour.accForm.open.body": "This button opens the form to create an account. With Next I open it for you; nothing is saved until you submit it.",
  "tour.accForm.name.title": "Name",
  "tour.accForm.name.body": "How you recognize it, for example “BBVA payroll” or “Wallet cash”.",
  "tour.accForm.balance.title": "Current balance",
  "tour.accForm.balance.body": "How much money it has today. From here on, every transaction you record raises or lowers it.",
  "tour.accForm.currency.title": "Currency",
  "tour.accForm.currency.body": "Each account has exactly one currency of its own, and by default it is your main currency. Choose it carefully: once the account has transactions, the currency cannot be changed; you would have to create another account.",
  "tour.accForm.bank.title": "Bank (optional)",
  "tour.accForm.bank.body": "Type to search your bank and choose it from the list; its logo will appear on the card. “No bank” is for cash or accounts that are not from a bank.",
  "tour.accForm.number.title": "Card or account number (optional)",
  "tour.accForm.number.body": "Only if you want to have it at hand. It is typed hidden and the eye lets you see it. We never ask for or store the CVV or the PIN.",
  "tour.accForm.type.title": "Account type",
  "tour.accForm.type.body": "Debit, credit, cash or savings. The type decides how the account is grouped: for example, today's total money does not count credit accounts.",
  "tour.accForm.submit.title": "Submit",
  "tour.accForm.submit.body": "It creates the account and its card appears right away in the row above. To cancel, close the window with the X.",

  // The account's movements summary (the wallet's summary, with this account's movements only).
  "tour.accSummary.name": "Movements summary",
  "tour.accSummary.what.title": "What it is for",
  "tour.accSummary.what.body": "It shows how this account's expenses or income are split by category: each slice is the category's sum ÷ the total of the period. The map, the bubbles and the ring are three ways of seeing the same distribution, and on the right is the list of categories. Tap a category to see its subcategories, and use the arrow to go back.",
  "tour.accSummary.filters.title": "Its period",
  "tour.accSummary.filters.body": "Above you choose the summary's period. Below you see from which day to which day it is calculated, and only this account's movements count.",

  // The account's movements list.
  "tour.accList.name": "Account movements",
  "tour.accList.what.title": "The list",
  "tour.accList.what.body": "All this account's movements, with their period, their type and their text search. Tap one to see or edit it. Transfers between your accounts do not count as income or expense.",
};

export default en;
