// The explanations of the "+" button and of each thing it creates, in English. Same keys and shape as ../createInfo.ts.
import type { CreateKind, InfoSection, InfoText } from '../createInfo';

export type { CreateKind, InfoText };

export const CREATE_SCREEN_INFO: InfoText = {
  title: 'Create',
  text: 'From here you create almost everything Gastify uses, without looking for each thing\'s screen. Choose above what you want to create and its form appears below. Each type plays a different role: expenses and income are movements (what comes in and goes out of your accounts), transfers move money between your accounts, and accounts and categories organize those movements. Budgets, savings and projects are money goals that fill up by themselves with your movements. Tap the ⓘ on each type to see how it is filled in.',
  sections: [
    {
      label: 'Movements',
      blocks: [
        { kind: 'definition', term: 'Expense', text: 'Money that goes out of an account: a purchase, a receipt, a meal. It feeds the expense charts.' },
        { kind: 'definition', term: 'Income', text: 'Money that comes into an account: salary, a sale, a refund. It adds to your income for the period and to your balance.' },
        { kind: 'definition', term: 'Transfer', text: 'Moving money from one of your accounts to another. It is neither income nor expense, so it does not change what you spent.' },
      ],
    },
    {
      label: 'To organize',
      blocks: [
        { kind: 'definition', term: 'Account', text: 'A place where you have money: a bank, a card, cash or savings. Every movement is saved in an account.' },
        { kind: 'definition', term: 'Category', text: 'A topic of your expenses or income: Food, Transport, Salary. The Summary and Analyzer charts group them this way.' },
      ],
    },
    {
      label: 'Goals',
      blocks: [
        { kind: 'definition', term: 'Budget', text: 'A spending limit per period (monthly, quarterly, half-yearly or yearly) for certain categories. It warns you at 70, 80, 90 and 100%.' },
        { kind: 'definition', term: 'Saving', text: 'An amount you want to save up. Its progress comes from the accounts you link to it, or from what you enter as saved.' },
        { kind: 'definition', term: 'Project', text: 'A planned expense with a start and an end, like a trip or a wedding. It adds up everything you spend linked to it, regardless of the month.' },
      ],
    },
    {
      label: 'Suggested order',
      blocks: [
        { kind: 'bullets', items: [
          'First, create your accounts with their current balance.',
          'Then your categories (you can use the ones the app already includes).',
          'Then record expenses, income and transfers as they happen.',
          'Finally, create budgets, savings or projects if you want to track a goal.',
        ] },
      ],
    },
  ] satisfies InfoSection[],
};

export const CREATE_KIND_INFO: Record<CreateKind, InfoText> = {
  expense: {
    title: 'Expense',
    text: 'An expense is money that goes out of one of your accounts. It is recorded the moment you pay.',
    sections: [
      {
        label: 'What to fill in',
        blocks: [
          { kind: 'table', head: ['Field', 'What to enter'], rows: [
            ['Amount', 'What you paid, in the currency of the account. If the merchant charged in another currency, a field appears to enter how much they charged.'],
            ['Account', 'The account the money comes out of. If you do not have one yet, create an account first.'],
            ['Category', 'What it was spent on (Food, Transport…). With a subcategory if you want more detail. It defines the charts.'],
            ['Budget', 'Optional. Links the expense to a budget or a project to see how much of its limit you have used.'],
            ['Date', 'When it happened. By default it is today.'],
            ['Name', 'Optional. If you leave it empty, the category is used.'],
            ['Tags', 'Optional, separated by commas. They help you filter later.'],
          ] },
        ],
      },
      {
        label: 'Example',
        blocks: [{ kind: 'example', text: 'You paid $65 for a coffee with your card: Amount 65, Account Card, Category Food › Coffee, Budget Food, date today.' }],
      },
    ],
  },
  income: {
    title: 'Income',
    text: 'Income is money that comes into one of your accounts. It is filled in like an expense, but it adds instead of subtracting.',
    sections: [
      {
        label: 'What to fill in',
        blocks: [
          { kind: 'bullets', items: [
            'Amount and the account where the money arrived.',
            'Category (for example Salary or Sales), so the income charts group it.',
            'Date, and an optional name.',
          ] },
          { kind: 'p', text: 'This form records what has already arrived. To project an income that repeats every month (your fixed salary, for example), create it as an income source in More › Projections.' },
        ],
      },
      {
        label: 'Example',
        blocks: [{ kind: 'example', text: 'Your biweekly pay was deposited: Amount 12,000, Account Payroll, Category Salary, date today.' }],
      },
    ],
  },
  transfer: {
    title: 'Transfer',
    text: 'Moves money from one of your accounts to another. It is neither income nor expense: it only changes place.',
    sections: [
      {
        label: 'What to fill in',
        blocks: [
          { kind: 'table', head: ['Field', 'What to enter'], rows: [
            ['From', 'The account the money comes out of.'],
            ['To', 'The account that receives it. It must be a different account, not the same one.'],
            ['Amount sent', 'How much is deducted from the source account.'],
            ['Amount received', 'Only appears if the two accounts have different currencies: how much arrives in the destination currency.'],
            ['Date and name', 'The date of the movement and an optional name, such as "Card payment".'],
          ] },
        ],
      },
      {
        label: 'Example',
        blocks: [{ kind: 'example', text: 'You paid the card from your payroll account: From Payroll, To Card, Amount 5,000. It does not count as an expense or as income.' }],
      },
    ],
  },
  account: {
    title: 'Account',
    text: 'An account is a place where you have money: your bank, your credit card, your cash or your savings account.',
    sections: [
      {
        label: 'What to fill in',
        blocks: [
          { kind: 'table', head: ['Field', 'What to enter'], rows: [
            ['Name', 'How you recognize it, for example "Payroll" or "Nu Card".'],
            ['Type', 'Debit, Credit, Cash or Savings. It helps you recognize it and group it.'],
            ['Currency', 'The currency you handle that account in.'],
            ['Balance', 'How much you have today. From here on, each movement changes it.'],
            ['Bank', 'Optional. Shows its logo on the account card.'],
            ['Number', 'Optional, only so you have it at hand. It is hidden with the eye icon. We never ask for the CVV.'],
          ] },
        ],
      },
      {
        label: 'Example',
        blocks: [{ kind: 'example', text: 'Your payroll account: Name Payroll, Type Debit, Currency MXN, Balance 8,400, Bank BBVA.' }],
      },
    ],
  },
  category: {
    title: 'Category',
    text: 'A category is a topic you spend or earn on. Every movement falls into a category.',
    sections: [
      {
        label: 'What to fill in',
        blocks: [
          { kind: 'bullets', items: [
            'Name, for example "Pets".',
            'Icon and color: only to recognize it at a glance.',
            'Subcategories (optional): one more level of detail. Food can have Restaurants and Groceries.',
          ] },
          { kind: 'p', text: 'Categories feed the Summary and Analyzer charts, and a budget covers one or more categories.' },
        ],
      },
      {
        label: 'Example',
        blocks: [{ kind: 'example', text: 'Pets, with the subcategories Kibble and Vet. From now on, that expense appears as Pets in the chart.' }],
      },
    ],
  },
  budget: {
    title: 'Budget',
    text: 'A budget is a spending limit for a period, on certain categories: "do not spend more than 4,000 on Food per month".',
    sections: [
      {
        label: 'What to fill in',
        blocks: [
          { kind: 'table', head: ['Field', 'What to enter'], rows: [
            ['Name', 'For example "Food".'],
            ['Currency and goal', 'The currency of the limit and how much you do not want to exceed.'],
            ['Period', 'Monthly, Quarterly, Half-yearly or Yearly. Each period starts counting from zero.'],
            ['Categories it covers', 'All the expenses in those categories add up against the limit.'],
          ] },
          { kind: 'equation', left: 'Progress', right: 'Spent ÷ Goal' },
          { kind: 'p', text: 'It warns you at 70, 80, 90 and 100%. If halfway through the period you have spent less than 50%, the app congratulates you.' },
        ],
      },
      {
        label: 'Example',
        blocks: [{ kind: 'example', text: 'Food: Goal 4,000 MXN per month, categories Food and Groceries. If you have spent 3,200, you are at 80%.' }],
      },
    ],
  },
  saving: {
    title: 'Saving',
    text: 'A saving is an amount you want to save up, such as an emergency fund or a vacation.',
    sections: [
      {
        label: 'What to fill in',
        blocks: [
          { kind: 'table', head: ['Field', 'What to enter'], rows: [
            ['Name and currency', 'For example "Emergency fund", in the currency you save it in.'],
            ['Goal', 'How much you want to save in total.'],
            ['Accounts that feed it', 'Optional. Its progress is the sum of the balances of those accounts.'],
            ['Saved so far', 'Only if you do not link accounts: how much you have. The app uses the higher of this and what you have recorded under that saving.'],
          ] },
          { kind: 'equation', left: 'Progress', right: 'Saved ÷ Goal' },
        ],
      },
      {
        label: 'Example',
        blocks: [{ kind: 'example', text: 'Emergency fund: Goal 30,000 MXN, linked to the Savings account. If the account has 12,000, you are at 40%.' }],
      },
    ],
  },
  project: {
    title: 'Project',
    text: 'A project is a planned expense with a start and an end date, like a trip, a wedding or a renovation.',
    sections: [
      {
        label: 'What to fill in',
        blocks: [
          { kind: 'table', head: ['Field', 'What to enter'], rows: [
            ['Name and currency', 'For example "Trip to Oaxaca".'],
            ['Goal', 'How much you plan to spend in total.'],
            ['Starts and ends', 'The dates of the project.'],
          ] },
          { kind: 'p', text: 'Its progress adds up everything you spend on that project, regardless of the month. To link an expense, choose the project in the Budget field of that expense.' },
        ],
      },
      {
        label: 'Example',
        blocks: [{ kind: 'example', text: 'Trip to Oaxaca: Goal 12,000 MXN, from December 1 to 10. Each dinner or ticket you link adds to its progress.' }],
      },
    ],
  },
};

// One line under the choice, so the form is never a mystery even before the "ⓘ" is opened.
export const CREATE_KIND_SUMMARY: Record<CreateKind, string> = {
  expense: 'Money that goes out of one of your accounts.',
  income: 'Money that comes into one of your accounts.',
  transfer: 'Moves money from one of your accounts to another. It is neither income nor expense.',
  account: 'A bank, a card, cash or a savings account.',
  category: 'A topic to group your expenses and income.',
  budget: 'A spending limit per period for certain categories.',
  saving: 'An amount you want to save up, with its progress.',
  project: 'A planned expense with a start and an end date.',
};
