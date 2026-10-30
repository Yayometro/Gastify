// Every explanation the app shows with a "?", in English. Same keys and same shape as ../appInfo.ts (a test keeps them in step):
// the Spanish file is the source, this one is the English version of each text, with the same tables, equations and examples.
import type { InfoBlock, InfoSection, InfoText } from '../createInfo';

export type { InfoBlock, InfoSection, InfoText };

// How a projection's accuracy percentage is worked out, in plain words and one formula.
const PRECISION_HELP = "Measures how close what you projected came to what really happened in a month that has already closed. 100% means you were exact; the further the projection drifts from the real figure, the lower the percentage. It is worked out separately for income and for expense, and the overall figure pools the two.";
export const PRECISION_SECTIONS: InfoSection[] = [
  {
    label: "How it is calculated",
    blocks: [
      { kind: "equation", left: "Accuracy", right: "100 × (1 − difference / larger)" },
      { kind: "p", text: "Difference = actual minus projected, without sign. Larger = the bigger of the two figures, without sign." },
      { kind: "p", text: "For a range of months, all the gaps are added up and divided by the sum of the figures, so a bigger month weighs more. If projected and actual are both zero, accuracy is 100%; if only one is zero, it is 0%." },
      { kind: "example", text: "You projected 900 of spending and spent 1,000: the gap is 100 and the larger figure is 1,000. 100 × (1 − 100 / 1,000) = 90%." },
    ],
  },
];

export const ACCURACY_SECTIONS: InfoSection[] = [
  {
    label: 'Projected vs. actual',
    blocks: [
      { kind: 'table', head: ['Column', 'What it is'], rows: [
        ['Projected', 'What you expected for that month based on what you had set up at the time (a limit or a historical reference). It is not recalculated later: editing a closed month today does not change what that month projected.'],
        ['Actual', 'What your movements say really happened.'],
        ['Variance', 'Actual − projected, one per row: the income one compares only income and the expense one compares only expenses.'],
      ] },
      { kind: 'equation', left: 'Variance', right: 'Actual − Projected' },
    ],
  },
  {
    label: 'How to read the colors',
    blocks: [
      { kind: 'p', text: 'The color always means the same thing (green: it went better than expected; red: it went worse), but "better" is different in each row:' },
      { kind: 'table', head: ['Row', 'Positive number', 'Negative number'], rows: [
        ['Income', 'green ▲ you earned more than projected', 'red ▼ you earned less'],
        ['Expense', 'red ▲ you spent more than projected', 'green ▼ you spent less'],
      ] },
      { kind: 'p', text: 'That is why the same month can show one row in red and another in green: they are two independent comparisons, not a combined total.' },
    ],
  },
  {
    label: 'Example',
    blocks: [
      { kind: 'example', text: 'You projected $50,000 of expenses and spent $47,000: a variance of −$3,000, green (you spent less). You projected $80,000 of income and earned $60,000: a variance of −$20,000, red (you earned less).' },
      { kind: 'p', text: 'Only closed months with a recorded projection history are shown. Tap a month to see its detail.' },
    ],
  },
];

export const VS_SECTIONS: InfoSection[] = [
  {
    label: 'What it shows',
    blocks: [{ kind: 'p', text: 'The chosen month against the immediately previous month, row by row.' }],
  },
  {
    label: 'How it is calculated',
    blocks: [
      { kind: 'equation', left: 'Change', right: '(Current − Previous) ÷ Previous' },
      { kind: 'equation', left: 'Savings', right: '(Income − Expenses) ÷ Income' },
      { kind: 'p', text: 'For "Savings" the change is given in percentage points (pts), not in %.' },
    ],
  },
  {
    label: 'How to read it',
    blocks: [
      { kind: 'table', head: ['Signal', 'Meaning'], rows: [
        ['▲', 'Went up (more than 0.5%)'],
        ['▼', 'Went down (more than 0.5%)'],
        ['▬', 'Barely changed (less than 0.5%)'],
      ] },
      { kind: 'legend', items: [
        { color: '#34d399', label: 'Green', text: 'Good news: more income, balance or savings, or less spending.' },
        { color: '#fb7185', label: 'Red', text: 'Bad news: less income, balance or savings, or more spending.' },
        { color: '#f59e0b', label: 'Orange', text: 'No change.' },
      ] },
    ],
  },
];

export const INSIGHTS_SECTIONS: InfoSection[] = [
  {
    label: 'How each box is calculated',
    blocks: [
      { kind: 'table', head: ['Box', 'Calculation'], rows: [
        ['Spending per day', 'Spending for the period ÷ days elapsed'],
        ['At the current pace', 'Spending per day × days in the period (only while it is still ongoing)'],
        ['What you keep', '(Income − Expenses) ÷ Income'],
        ['Expenses vs. previous', '(Expenses − expenses of the previous period) ÷ expenses of the previous period'],
        ['Income vs. previous', 'The same, with income'],
        ['What weighs the most', 'The category with the most spending and its share of total spending'],
        ['Largest expense', 'The highest expense movement of the period'],
        ['Average expense', 'Total spending ÷ number of expenses'],
        ['Balance', 'Income − Expenses, and how many movements the period had'],
      ] },
      { kind: 'p', text: 'Changes compare against the immediately previous period of the same length.' },
    ],
  },
  {
    label: 'How to use it',
    blocks: [{ kind: 'bullets', items: ['Tap any part of the card to open the full Wallet Analyzer.'] }],
  },
];

export const BUDGET_FACES_SECTIONS: InfoSection[] = [
  {
    label: 'What it shows',
    blocks: [{ kind: 'p', text: 'Your budgets for the period, from the one closest to its limit to the furthest. Each bar is spent ÷ the limit, and the circle marks the percentage.' }],
  },
  {
    label: 'The face',
    blocks: [
      { kind: 'table', head: ['Face', 'Spent ÷ limit', 'Meaning'], rows: [
        ['🤩', 'less than 30%', 'You are well within the limit'],
        ['🙂', '30% to 60%', 'Everything in order'],
        ['😐', '60% to 85%', 'Watch out, you have already used a good part'],
        ['😰', '85% to 100%', 'Very close to the limit'],
        ['🔥', 'more than 100%', 'You exceeded the limit'],
      ] },
      { kind: 'p', text: 'In savings budgets the reading is reversed: 🤩 from 85% of the goal, 🙂 from 35% to 85%, and 😟 below 35%.' },
    ],
  },
  { label: 'How to use it', blocks: [{ kind: 'bullets', items: ['Tap a budget to see its movements.'] }] },
];

export const PROJECTION_MONTHS_SECTIONS: InfoSection[] = [
  {
    label: 'What it shows',
    blocks: [
      { kind: 'p', text: 'Each month of the year on a card, in your main currency.' },
      { kind: 'table', head: ['Label', 'Where the figures come from'], rows: [
        ['Actual', 'A month that already happened: your movements.'],
        ['Estimated', 'A future month: your income sources, your budgets and your historical references.'],
        ['This month', 'Starts as estimated and fills in with actuals as the month goes by.'],
      ] },
    ],
  },
  {
    label: 'How it is calculated',
    blocks: [
      { kind: 'equation', left: 'Net', right: 'Income − Expenses' },
      { kind: 'p', text: 'Balance = the money you would have at the end of the month. ≈ is an estimate made backwards, because you did not save the actual balance of that month.' },
    ],
  },
  {
    label: 'How to use it',
    blocks: [{ kind: 'bullets', items: ['Tap a month to see its movements, compare actual against budgeted, save the actual balance and adjust the unexpected limits.'] }],
  },
];

export const PACE_SECTIONS: InfoSection[] = [
  {
    label: 'What it shows',
    blocks: [{ kind: 'p', text: 'Whether this month you are spending faster or slower than usual, comparing the same day of the month.' }],
  },
  {
    label: 'How it is calculated',
    blocks: [
      { kind: 'equation', left: 'Usual', right: 'Average spent by the same day in the previous 6 months' },
      { kind: 'equation', left: '%', right: '(This month − Usual) ÷ Usual' },
    ],
  },
  {
    label: 'How to read it',
    blocks: [{ kind: 'legend', items: [
      { color: '#fb7185', label: 'Red', text: 'You are spending faster than usual.' },
      { color: '#34d399', label: 'Green', text: 'You are spending slower than usual.' },
    ] }],
  },
  { label: 'How to use it', blocks: [{ kind: 'bullets', items: ['Open "See more" to review each month.'] }] },
];

// The three panels at the top of the dashboard (the phone's carousel and the tablet's hero): what each one says.
export const HERO_INFO = {
  versus: {
    title: 'Versus the previous period',
    text: 'Compares your income, expenses and balance for the chosen period with the immediately previous period of the same length.',
    sections: [
      {
        label: 'What it shows',
        blocks: [{ kind: 'p', text: 'Each row (Income, Expenses, Balance) shows what changed in money, the percentage, what the previous period was worth and what it is worth now.' }],
      },
      {
        label: 'How it is calculated',
        blocks: [
          { kind: 'equation', left: 'Change', right: 'Current − Previous' },
          { kind: 'equation', left: '%', right: '(Current − Previous) ÷ Previous' },
          { kind: 'p', text: 'The previous period is the stretch right before the chosen one, with the same length: if you look at October, it is September; if you look at 7 days, it is the 7 days before.' },
        ],
      },
      {
        label: 'How to read it',
        blocks: [
          { kind: 'table', head: ['Signal', 'Meaning'], rows: [['▲', 'Went up compared with the previous period'], ['▼', 'Went down compared with the previous period']] },
          { kind: 'legend', items: [
            { color: '#6EE7A8', label: 'Income', text: 'Green: what came in.' },
            { color: '#FF8A8A', label: 'Expenses', text: 'Red: what went out.' },
            { color: '#7EC8FF', label: 'Balance', text: 'Blue: income − expenses.' },
          ] },
        ],
      },
    ],
  } satisfies InfoText,
  summary: {
    title: 'Period summary',
    text: 'What came in, what went out and what was left in the chosen period.',
    sections: [
      {
        label: 'How it is calculated',
        blocks: [
          { kind: 'equation', left: 'Balance', right: 'Income − Expenses' },
          { kind: 'p', text: 'Income and expenses add up the movements of the period in your main currency. Transfers between your accounts do not count, because they neither come in nor go out of your money.' },
        ],
      },
      { label: 'How to use it', blocks: [{ kind: 'bullets', items: ['Change the period with the filters above; the summary updates.'] }] },
    ],
  } satisfies InfoText,
  accounts: {
    title: 'Your accounts',
    text: 'Your accounts, from the highest balance to the lowest.',
    sections: [
      {
        label: 'What it shows',
        blocks: [
          { kind: 'p', text: 'The current balance of each account in its own currency (the ones that are not in your main currency carry their code next to them).' },
          { kind: 'p', text: 'The total converts each balance to your main currency at the most recent exchange rate. Credit cards are not added to your available money.' },
        ],
      },
      { label: 'How to use it', blocks: [{ kind: 'bullets', items: ['Open "Accounts" from the menu to create, edit or reorder your accounts.'] }] },
    ],
  } satisfies InfoText,
};

// What the History screen is for and how each of its modules reads.
export const HISTORY_INFO = {
  title: 'History',
  text: 'History is for comparing your money over time: months, quarters, half-years and years.',
  sections: [
    {
      label: 'What it is for',
      blocks: [
        { kind: 'p', text: 'It is the screen for looking back and comparing: did I spend more than last year? was this quarter better than the previous one? which months weigh the most? It was built for long periods, not for day to day (for that there are Home and Movements).' },
      ],
    },
    {
      label: 'How to use it',
      blocks: [
        {
          kind: 'bullets',
          items: [
            'Choose the period above (by default, the last 3 months) and move it with the arrows.',
            'Turn on "Compare with another period" to see each figure against the same stretch of last year, against the previous period, or against one you choose.',
            'Each module below can have its own period ("Same as above" follows it).',
          ],
        },
      ],
    },
    {
      label: 'What each module does',
      blocks: [
        {
          kind: 'table',
          head: ['Module', 'What for'],
          rows: [
            ['Period', 'Choose the stretch to analyze and, if you want, what to compare it with.'],
            ['Summary', 'Income, expenses and balance of the period (and of the compared one).'],
            ['Period data', 'Movements, what you kept, average spending per month, what weighs the most and the largest expense.'],
            ['Month by month', 'Bars of income and expenses for each month; tap a month to see its detail.'],
            ['Income and expenses by category', 'Where your money went and where it came from; tap a category to see its subcategories and movements.'],
            ['Largest expenses', 'The largest transaction, category and subcategory of the last 12 months and who led each month.'],
            ['Recurring subscriptions', 'Charges that repeat every month.'],
            ['Budgets of the period', 'How many months you met each budget and how much you spent against its goal.'],
            ['Projections', 'The net of each month of the year, actual or estimated.'],
            ['Top', 'The largest categories or movements, month by month to compare them.'],
          ],
        },
      ],
    },
  ] as InfoSection[],
};

// The long explanation of the projections' accuracy: the same text as the app's card.
export const ACCURACY_HELP = [
  'PROJECTED VS. ACTUAL',
  '"Projected" is what you expected for that month based on what you had set up at that time (a limit, or your historical reference); it is not recalculated later, so editing a month that is already closed today does not change what that month "projected". "Actual" is what your movements say really happened.',
  'VARIANCE: TWO NUMBERS, ONE PER ROW',
  'The income one is actual income minus projected income. The expense one is actual expenses minus projected expenses. They are not related to each other: each one compares its own column.',
  'WHY THE COLOR DOES NOT FOLLOW THE SAME SIGN IN BOTH',
  'The color always means the same thing (green: it went better than expected; red: it went worse), but "better" looks different in each one. In income, more money than projected is good: a positive number is green and a negative one is red. In expenses, spending less than projected is good: a negative number is green and a positive one is red. That is why the same month can show one row in red and the other in green: they are two independent comparisons, not a combined total.',
  'EXAMPLE',
  'You projected $50,000 of expenses and spent $47,000: an expense variance of -$3,000, green (you spent less). You projected $80,000 of income and earned $60,000: an income variance of -$20,000, red (you earned less).',
  'Only closed months with a recorded projection history are shown. Tap a month to see its detail.',
].join('\n\n');

// The explanation of each "?", by an id that names the window it belongs to.
export const APP_INFO = {
  'distribuci_n_del_gasto': { title: 'Spending breakdown', text: 'Each segment shows what share of the movements that count for this budget belongs to a category or subcategory. The percentage is calculated over those movements.' },
  'gasto_total': { title: 'Total spending', text: 'The sum of all your expenses for the chosen period, whether or not a budget covers them, in your main currency. It tells you how much goes out in total before you see how much is under control. Tap the card to see the breakdown by budget.' },
  'sin_presupuesto': { title: 'No budget', text: 'Total spending for the period minus what falls inside an active budget (by category or subcategory). The percentage is that part ÷ total spending. It helps you spot money that goes out without control. Tap the card to see which categories it comes from and to create a budget.' },
  'cuentas': { title: 'Accounts', text: 'Each card is an account with its current balance. "In" and "out" are the sum of that account\'s income and expenses in the period chosen above. The total converts each balance to your main currency at the most recent exchange rate (credit cards are not added to your available money).' },
  'ltimos_movimientos': { title: 'Latest movements', text: 'The movements with the most recent date across your whole account (five on the phone; on the tablet, as many as fit next to your budgets), without applying the period above (it is the only card that ignores it). It helps you quickly review the latest things you recorded. Tap one to view or edit it, or open the full list with its filters.' },
  'ltimos_movimientos_2': { title: 'Latest movements', text: 'The five movements with the most recent date across your whole account, without applying the period above (it is the only card that ignores it). It helps you quickly review the latest things you recorded. Tap one to view or edit it, or open the full list with its filters.' },
  'banco_y_n_mero': { title: 'Bank and number', text: 'The bank the account belongs to and, if you wanted, its card or account number, hidden by default (tap the eye icon to show it). The CVV or PIN is never saved.' },
  'resumen_de_cuentas': { title: 'Accounts summary', text: 'One card per account, with its current balance in its own currency and, if it is in another currency, its approximate equivalent in your main one. What came in and went out are those of the period chosen above. Tap an account’s name to open its detail in Accounts, with its transactions and summary. Drag a card to change the order; the order is saved to your account.' },
  'analizador_resumen': { title: 'Month summary', text: 'The month’s highlights, calculated from your transactions: exceeded limits, categories out of the ordinary, subscriptions, your savings rate and the spending peaks. Tap a card to see the calculation behind it. “See full analysis” opens the Wallet Analyzer with the whole month: comparisons, trend, budgets and more.' },
  'formulario_presupuesto': { title: 'Budget', text: 'A budget sets a spending limit for certain categories over a period, saves money toward a goal, or tracks a project between two dates. Each kind shows its own fields; tap the compass to see each one.' },
  'formulario_cuenta': { title: 'Account', text: 'An account holds money in one place (bank, cash, credit card or savings) with its starting balance. Its transactions add to or subtract from that balance. Tap the compass to see each field.' },
  'formulario_categoria': { title: 'Category', text: 'A category groups your transactions and budgets. Give it a name, a color and an icon; if you like, also create a subcategory inside it. Tap the compass to see each field.' },
  'categor_as_predeterminadas': { title: 'Default categories', text: 'The catalog Gastify comes with: ready-to-use categories and subcategories. They cannot be edited or removed; if you need something different, create your own under “Your categories”.' },
  'analizador_suscripciones': { title: "Recurring subscriptions", text: "Expenses with the same name that appear in at least 2 of the last 3 months are detected, with an amount that varies by less than 15%. The amount shown is the most recent charge. Tap one to review its dates and amounts (and open each movement); it is marked \"new\" if it did not exist before, and \"possible duplicate\" if there are two charges less than 48 hours apart in the month. Expenses with the same name that repeat in at least 2 of the last 3 months, with an amount that varies by less than 15%. Tap the card to see them all, with their account, category and charges; tap a charge to open the movement. It is marked \"new\" if it did not exist before, and \"possible duplicate\" if there are two charges less than 48 hours apart in the same month." },
  'precision_de_proyecciones': { title: "Projection accuracy", text: PRECISION_HELP, sections: PRECISION_SECTIONS },
  'analizador_cuentas': { title: "Your accounts", text: "Compare your accounts with each other over the period: which one holds the most money, which one spends the most, which one receives the most, each one's flow and how its balance changed month by month. Transfers between your accounts are neither spending nor income." },
  'analizador_patron_por_dia': { title: "Weekday pattern", text: "The spending of each day of the week in the chosen month is added up and divided by how many times that day fell (a month has 4 or 5 of each), so the comparison is fair. \"See detail\" shows the week with the most spending and each day. The spending of each day of the week (all the Mondays, all the Tuesdays…) during the month is added up and divided by how many times that day fell; a month has 4 or 5 of each, so dividing makes the comparison fair." },
  'tendencia_mes': { title: "Month summary", text: "That month's summary: its income, its spending and the balance, the difference between them (what was left or missing). Below are the figures they were calculated from." },
  'buffers': { title: 'Buffers', text: "Buffers are manual amounts added to your estimate, for what does not fall under a budget or a recurring income source. Unexpected expenses: money that goes out without its own budget; it is added to your expense estimate. Unexpected income: money that comes in without being a recurring source; it is added to your income estimate. Leave them at 0 if you don't need them." },
  'movimientos_pagina': { title: "Transactions", text: "Everything you have recorded, by day. Here you search and filter, select several to edit or delete them, export or import from Excel, and tap one to see its detail." },
  'movimientos_de_la_cuenta': { title: 'Account movements', text: 'What came in and went out of this account in the chosen period, and its most recent movements. Transfers between your accounts do not count as income or expenses.' },
  'categor_as_y_subcategor_as': { title: 'Categories and subcategories', text: 'This is how you organize your money: every transaction and every budget belongs to a category and, if you want more detail, to a subcategory inside it. Gastify comes with a default catalog that cannot be modified; you can create your own, with their name, color and icon, and edit or remove them whenever you want. The search box filters all four lists at once.' },
  'total': { title: 'Total', text: 'The sum of the balance of all your accounts, each one converted to your main currency at the most recent exchange rate (balance × rate). If a currency has no exchange rate, that account is not added and you are told. It tells you how much money you have in total today.' },
  'vs_el_mes_anterior': { title: 'VS previous month', text: 'Compares the chosen month with the immediately previous month. "Change" is (current − previous) ÷ previous. The arrow ▲ goes up, ▼ goes down and ▬ means it barely changed (less than 0.5%). Green is good news (more income, less spending, more balance or savings), red is bad news and orange means no change. Savings is the part of your income you keep: (income − expenses) ÷ income.', sections: VS_SECTIONS },
  'promedio_mensual': (monthsCount: number) => ({ title: 'Monthly average', text: `It is the average of the ${monthsCount} months of the trend (the chosen month and the ${Math.max(0, monthsCount - 1)} before it): the income, expenses and movements of those months are added up and divided by ${monthsCount}. It is the same calculation as on the web. Tap to see month by month.` }),
  'tendencia': { title: 'Trend', text: 'Income (green) and expenses (red) for each of the last six months, ending in the chosen month. Tap a month to see its table: income, expenses and balance against the previous month, with arrows showing whether they went up or down.' },
  'vs_el_mes_anterior_2': { title: 'VS previous month', text: 'Compares the chosen month with the immediately previous month. "Change" is (current − previous) ÷ previous. The arrow ▲ goes up, ▼ goes down and ▬ means it barely changed (less than 0.5%). Green is good news (more income, less spending, more balance or savings), red is bad news and orange means no change. Savings is the part of your income you keep: (income − expenses) ÷ income.', sections: VS_SECTIONS },
  'tendencia_2': { title: 'Trend', text: 'Income (green) and expenses (red) for each of the last six months, ending in the chosen month. Tap a month to see its table: income, expenses and balance against the previous month, with arrows showing whether they went up or down.' },
  'promedio_mensual_2': (monthsCount: number) => ({ title: 'Monthly average', text: `It is the average of the ${monthsCount} months of the trend (the chosen month and the ${Math.max(0, monthsCount - 1)} before it): the income, expenses and movements of those months are added up and divided by ${monthsCount}. It is the same calculation as on the web. Tap to see month by month.` }),
  'analyzer': (topN: number | string) => ({ title: `Top ${topN}`, text: 'The categories and movements with the most spending in the chosen month, with the change against the previous month. Tap a category to see all its movements, or a movement to open it directly.' }),
  'pagos_recurrentes': { title: 'Recurring payments', text: 'Expenses with the same name that repeat in at least 2 of the last 3 months, with an amount that varies by less than 15%. Tap the card to see them all, with their account, category and charges; tap a charge to open the movement. It is marked "new" if it did not exist before, and "possible duplicate" if there are two charges less than 48 hours apart in the same month.' },
  'ritmo_de_gasto': { title: 'Spending pace', text: 'It adds up what has been spent from day 1 to today and compares it with the average of what you had spent by the same day of the month in the previous 6 months. The percentage is (this month − usual) ÷ usual: red if you are spending faster, green if slower. It helps you correct in time, before the month ends. Open See more to review each month.', sections: PACE_SECTIONS },
  'ritmo_de_gasto_2': { title: 'Spending pace', text: 'It adds up what has been spent from day 1 to today and compares it with the average of what you had spent by the same day of the month in the previous 6 months. The percentage is (this month − usual) ÷ usual: red if you are spending faster, green if slower. It helps you correct in time, before the month ends. Open See more to review each month.', sections: PACE_SECTIONS },
  'periodo': { title: 'Period', text: 'Choose which stretch of time to analyze; all the cards below that say "Same as above" follow it. When you compare with another period (the same stretch of last year, the immediately previous period of the same length, or one you choose), each figure shows how much it changed. By default the last 3 months are analyzed.' },
  'resumen': { title: 'Summary', text: 'Income = the sum of what came in during the period; expenses = the sum of what went out; balance = income − expenses. Transfers between your accounts do not count. With a comparison active, the right column is the other period and the percentage is (period − compared) ÷ compared; for expenses, an increase is bad (red) and a decrease is good (green).' },
  'datos_del_periodo': { title: 'Period data', text: 'Quick readings of the same period: how many movements it had, what share of your income you kept ((income − expenses) ÷ income), how much you spent on average per month, which category weighed the most and what your largest expense was. They are calculated with the same movements as the summary.' },
  'resumen_2': { title: 'Summary', text: 'Income = the sum of what came in during the period; expenses = the sum of what went out; balance = income − expenses. Transfers between your accounts do not count. With a comparison active, the right column is the other period and the percentage is (period − compared) ÷ compared; for expenses, an increase is bad (red) and a decrease is good (green).' },
  'gastos_por_categor_a': { title: 'Expenses by category', text: 'The sum of the expenses of each category in the period, from highest to lowest; the bar is the category ÷ the largest on the list. Filter: it has its own period (by default "Same as above", with its comparison if you turned it on), but you can choose another one without changing the rest of the screen. It helps you see where your money went. Tap a category to see its movements.' },
  'ingresos_por_categor_a': { title: 'Income by category', text: 'The sum of the income of each category in the period, from highest to lowest; the bar is the category ÷ the largest on the list. Filter: it has its own period, the same as expenses. It helps you see where your money comes from. Tap a category to see its movements.' },
  'gastos_por_categor_a_2': { title: 'Expenses by category', text: 'The sum of the expenses of each category in the period, from highest to lowest; the bar is the category ÷ the largest on the list. Filter: it has its own period (by default "Same as above", with its comparison if you turned it on), but you can choose another one without changing the rest of the screen. It helps you see where your money went. Tap a category to see its movements.' },
  'ingresos_por_categor_a_2': { title: 'Income by category', text: 'The sum of the income of each category in the period, from highest to lowest; the bar is the category ÷ the largest on the list. Filter: it has its own period, the same as expenses. It helps you see where your money comes from. Tap a category to see its movements.' },
  'mes_a_mes': { title: 'Month by month', text: 'Each month of the year on a card. Income: what comes in. Expenses: what goes out. Net: income minus expenses (green if there is a surplus, red if there is a shortfall). Balance: the money you would have at the end of the month, in your main currency. "Actual" is a month that already happened, with your movements; "Estimated" is projected with your income sources, budgets and historical references; "This month" starts as estimated and fills in with actuals. With ≈, the balance is an estimate made backwards when you did not save the actual balance. All figures are in your main currency. Tap a month to see its movements, compare actual against budgeted, save the actual balance and adjust the unexpected limits.', sections: PROJECTION_MONTHS_SECTIONS },
  'importar_desde_excel': { title: "Import from Excel", text: "Upload a file with many movements at once, instead of entering them one by one. It is useful to bring in your bank statement or your history. All the movements are created when you upload the file." },
  'gastos_recurrentes': { title: "Recurring expenses", text: "Expenses that repeat by themselves: rent, subscriptions, utilities. Fixed-amount ones are created when you open Gastify. Variable ones wait for you to confirm how much it was this time. You can pause them, change their amount or delete them; the charges already created stay." },
  'categorizador': { title: "Transaction categorizer", text: "It reviews your uncategorized transactions and suggests a category based on your rules. Nothing changes until you approve it." },
  'plantilla': { title: 'Template', text: 'It is the same format the web uses. Fill it in with date, description, amount, currency and type; categories, tags and accounts are linked to the ones you already have.' },
  'seleccionar_movimientos': { title: 'Select movements', text: 'Mark the movements you want to change. With the buttons you change a single field of all of them at once (name, date, type, category or account), or you use general editing to fill in several fields together. Whatever you leave empty stays as it was in each movement. "Delete" removes all the selected ones. Long-pressing a movement also selects it.' },
  'notificaciones': { title: 'Notifications', text: 'We let you know when a budget reaches 70, 80, 90 or 100% of its limit, when a savings goal advances, and when you are doing well halfway through the period. Each alert appears once per budget and period. Swipe an alert left or right to remove it from the list.' },
  'c_mo_leer_esto': { title: 'How to read this', text: 'Each row is a month (or a date) that was used to calculate the signal. ✓ means the limit or goal was met; ✗, that it was not. Amounts are in your main currency.' },
  'cumplimiento_del_presupuesto': { title: 'Budget compliance', text: 'Each month, what was spent in the category is compared with the budget limit. ✓ if you did not exceed it, ✗ if you did. The streak counts the consecutive months, up to the current one, within the limit. If the budget is new, earlier months use its oldest goal as an estimate.' },
  'l_deres_por_mes': { title: 'Leaders by month', text: 'For each of the last twelve months, the movement, category or subcategory with the most spending is found. The list goes from highest to lowest so you can see which one won the year. For categories, the % is its share of the spending over the twelve months.' },
  'de_d_nde_sale_este_an_lisis': { title: 'Where this analysis comes from', text: 'It does not use artificial intelligence: each sentence is a direct reading of a calculation over your last twelve months (whether the largest transaction is in the leading category, what share of the spending the category is, how isolated the expense was and which label repeats).' },
  'c_mo_se_calcula': { title: 'How it is calculated', text: 'The spending of each day of the week (all the Mondays, all the Tuesdays…) during the month is added up and divided by how many times that day fell; a month has 4 or 5 of each, so dividing makes the comparison fair.' },
  'lo_m_s_destacado': { title: 'Highlights', text: 'Signals calculated with your movements of the month: exceeded limits, categories outside the usual range (against the average of the previous 6 months, not counting the current one, and with at least 3 months of history), detected subscriptions, streaks and spending pace. Tap one to see the months and the calculation behind it. They are not additional movements.' },
  'proyecci_n_del_mes': { title: 'Projection for the month', text: 'It contrasts what was planned with what actually happened in the chosen month. Planned = your income sources (income) and your active budgets plus the limits you have set (expenses); actual = the sum of your movements for the month. For a closed month the comparison only appears if there were recorded references or adjustments; in the current month it shows the progress against what was planned. It helps you see whether your plan is being met.' },
  'presupuestos_del_analizador': { title: 'Analyzer budgets', text: 'Compares the spending of each budget with its limit in the period, from the fullest or exceeded ones to the least full, and shows how many consecutive months it was met (the streak). Tap one to see its last 12 months: what was spent, the limit of each month and whether it was met.' },
  'grandes_gastos': { title: 'Largest expenses', text: 'Shows the transaction, category and subcategory with the most spending over the last twelve months. Tap each one to see who led each month, or open "See month by month" for the full summary and "See analysis" for a reading in words.' },
  'exposici_n_multimoneda': { title: 'Multi-currency exposure', text: 'Your balances in currencies other than the main one, converted at the current exchange rate (native balance × rate). The percentage compares that value with the one the SAME native balance had at the close of the previous month; it measures how much the exchange rate helped or hurt you, it is not the return of the account. It helps you know how exposed you are to changes in other currencies.' },
  'patr_n_semanal': { title: 'Weekly pattern', text: 'The spending of each day of the week in the chosen month is added up and divided by how many times that day fell (a month has 4 or 5 of each), so the comparison is fair. "See detail" shows the week with the most spending and each day.' },
  'detalle_de_la_categor_a': { title: 'Category detail', text: 'The category total = the sum of all its movements in the period. Below, each subcategory with its total, sorted from highest to lowest spending, and inside each one its movements, also from highest to lowest. With the switch you can reverse the order (from lowest to highest). Tap a movement to open it.' },
  'presupuestos_del_periodo': { title: 'Budgets of the period', text: 'For each budget it counts, month by month of the period, how many months the spending did not exceed the goal (for example 4 of 6), and compares the total spending against the total goal of the period. If you turn on the comparison above, you will also see the results of the other period. Tap a row to review each month; ≈ indicates an estimated goal (the budget is newer than that month).' },
  'grandes_gastos_2': { title: 'Largest expenses', text: 'The largest transaction, category and subcategory of the rolling year that ends in the chosen period. Tap each one to see who led each month (with its month), "See month-by-month leaders" for the summary, and "See analysis" for a reading in words.' },
  'suscripciones_recurrentes': { title: 'Recurring subscriptions', text: 'Expenses with the same name that appear in at least 2 of the last 3 months are detected, with an amount that varies by less than 15%. The amount shown is the most recent charge. Tap one to review its dates and amounts (and open each movement); it is marked "new" if it did not exist before, and "possible duplicate" if there are two charges less than 48 hours apart in the month.' },
  'mes_a_mes_2': { title: 'Month by month', text: 'Income (green) and expenses (red) for each month of the period, with the figure above each bar. Tap a month to see its detail and its leading category. If you compare, the faded bars correspond to the month and year indicated below.' },
  'detalle_del_mes': (previous: boolean) => ({ title: 'Month detail', text: previous ? 'On the left, the chosen month of the period; on the right, the month that corresponds to it in the period you compare with. Each row compares the same thing: income against income, expenses against expenses, balance against balance, and the category that weighed the most in each month.' : 'The income and expenses of the month, its balance (income − expenses) and the category with the most spending that month.' }),
  'proyecciones': { title: 'Projections', text: 'Each bar is the net of the month (income − expenses). Closed months use your actual movements; future ones are estimated with your income sources, your budgets and your historical references; the current month mixes both. Green: there is a surplus. Red: there is a shortfall. Tap "See the detail" for the full table and the detail of each month.' },
  'c_mo_leer_esta_tabla': { title: 'How to read this table', text: ACCURACY_HELP, sections: ACCURACY_SECTIONS },
  'presupuestos': { title: 'Budgets', text: 'Each bar is what was spent in the budget period ÷ its limit; the circle marks the percentage, and the face changes mood depending on how close you are to the limit (calm green, orange when close, red when exceeded). They are sorted the same way as in Budgets: first the bar that is fullest or past its limit, and so on down to the emptiest. Up to 10 are shown here; "See all" opens them all. Tap one to see its movements.', sections: BUDGET_FACES_SECTIONS },
  'an_lisis_del_periodo': {
        title: 'Period analysis',
        text: 'Spending per day = spending for the period ÷ days elapsed. At the current pace = that average × the days in the period (only while it is still ongoing). What you keep = (income − expenses) ÷ income. Changes compare against the immediately previous period of the same length. Average expense = total spending ÷ the number of expenses. Tap any part of the card to open the full Wallet Analyzer.', sections: INSIGHTS_SECTIONS },
  'resumen_de_transacciones': { title: 'Transactions summary', text: 'Shows how your expenses (or income) are split among categories: each slice is the category\'s sum ÷ the total of the period. The ring, the bubbles and the map are three ways of seeing the same distribution, and the table lists the categories with their percentage and amount (up to 15 here; if there are more, "See the N categories" opens a large window with all of them). Tap a category to see its subcategories, and use the arrow to go back. Filters: it has its own period, which can be different from Home\'s; open More filters to change it.' },
  'los_m_s_grandes': { title: 'The largest', text: 'What it is for: to see where most of your money went. How it is calculated: the expenses (or income) of the period are taken, grouped by category and sorted from highest to lowest sum; in "Movements" they are sorted one by one by amount. Filter: the period and the type (expenses or income) you choose in this card; transfers between your accounts do not count.' },
  'filtros': { title: 'Filters', text: 'Narrows the list: by text, type, readability, category, account or exact amount. The duplicate finder locates repeated movements so you can delete them all at once.' },
  'acceso': { title: 'Access', text: 'The email and password you use to sign in to Gastify. If you sign in with Google and never set a password, you can create one here.' },
  'tokens_de_acceso': { title: 'Access tokens', text: 'A token lets another tool (an assistant, a script) read and write in your account without your password. It is shown only once, when you create it; if you lose it, revoke it and create another.' },
  'moneda_principal': {
        title: 'Main currency',
        text: 'The currency your totals, budgets, history and projections are shown in. Each account keeps its balance in its own currency; only the way the totals are presented changes, converted at the most recent exchange rate. Changing it does not modify any movement.',
      },
  'passkeys': { title: 'Passkeys', text: 'A passkey lets you sign in with your fingerprint, your face or the code on your phone, without a password. It is added from the web or from the installed app.' },
  'verificaci_n_en_dos_pasos': { title: 'Two-step verification', text: 'In addition to your password, Gastify asks for a 6-digit code from an authenticator app. Backup codes are useful if you lose your phone: keep them somewhere safe.' },
  'c_mo_leer_esta_tabla_2': { title: 'How to read this table', text: ACCURACY_HELP, sections: ACCURACY_SECTIONS },
  'referencias_hist_ricas': { title: 'Historical references', text: 'Amounts per month that the projections use as a starting point: what really came in or went out, or an estimate that holds for a while. Income and expenses are saved separately.' },
  'fuentes_de_ingreso': { title: 'Income sources', text: 'What comes in each period (salary, rents…). The projections add it up month by month, converted to the main currency.' },
  'c_mo_leer_este_mes': { title: 'How to read this month', text: 'Closed months show your actual movements. Future ones are a pure estimate, made with your active budgets (expenses) and your income sources (income). The current month mixes both: it starts as estimated and fills in with actuals. With "View movements" you see the movements behind these figures, and the limits below are used to add money that is not tied to any budget or income source.' },
  'saldo_real_del_mes': { title: 'Actual balance for the month', text: 'The app cannot calculate past balances on its own. If you know how much you had in your accounts at the end of this month, record it here: it is used as the starting point in the balance column of the projection.' },
  'tope_de_gasto_inesperado': { title: 'Unexpected expense limit', text: 'A manual amount that is added to your expense estimate, for expenses that do not have their own budget.' },
  'tope_de_ingreso_inesperado': { title: 'Unexpected income limit', text: 'A manual amount that is added to your income estimate, for money that comes in and is not tied to a recurring income source.' },
  'periodo_de_oportunidades': {
    "title": "Which period we are looking at",
    "text": "The period is the stretch of your history we review: so far this month, quarter or year, or dates you choose. The longer it is, the more money goes into the calculation.",
    "sections": [
      {
        "label": "Simply",
        "blocks": [
          {
            "kind": "bullets",
            "items": [
              "“So far this year” counts from January 1 up to today.",
              "If you pick your own dates, the first and the last day are included.",
              "Changing the period only recalculates the screen: it does not touch your movements."
            ]
          }
        ]
      },
      {
        "label": "Technical detail",
        "blocks": [
          {
            "kind": "bullets",
            "items": [
              "Month, quarter and year start on the first day of the period and run to today.",
              "Completed expenses recorded in Gastify inside those dates are used; refunds and fees are shown apart.",
              "The analysis only includes what you recorded in Gastify: it knows nothing about spending you did not write down."
            ]
          }
        ]
      }
    ]
  },
  'filtros_de_oportunidades': {
    "title": "What “Analyze by” means",
    "text": "It is how you choose which expenses to look at. For example, “Category → Restaurants” reviews only what you spent at restaurants. It changes none of your movements and does not decide for you which spending is good or bad.",
    "sections": [
      {
        "label": "Each option, simply",
        "blocks": [
          {
            "kind": "definition",
            "term": "All recorded expenses",
            "text": "Reviews everything you spent in the period. It is the widest starting point, so it makes sense to set aside only a small share (5 % or 10 %): not everything can be avoided."
          },
          {
            "kind": "definition",
            "term": "Category",
            "text": "Looks at a whole theme, such as Restaurants or Transport. You fill it by picking the category from a list."
          },
          {
            "kind": "definition",
            "term": "Sub-category",
            "text": "Looks at a finer part of a category, such as “Fast food” inside Restaurants. You fill it by picking the sub-category from a list."
          },
          {
            "kind": "definition",
            "term": "Tag",
            "text": "Gathers movements that carry the same tag even if they are in different categories, such as “trip” or “work”. You fill it by picking a tag you already use."
          },
          {
            "kind": "definition",
            "term": "Description contains",
            "text": "Looks for a word in the movement's name, such as a shop's name. You fill it by typing the text; check the matches because similar names can be different expenses."
          }
        ]
      },
      {
        "label": "Technical detail",
        "blocks": [
          {
            "kind": "p",
            "text": "The period is applied first; then the filter narrows the movements. Different filters combine with “and”; inside one list “or” is enough. Only expenses with an amount available in your main currency are added up."
          }
        ]
      }
    ]
  },
  'tres_alternativas_de_ese_monto': {
    "title": "Four ways to imagine the same money",
    "text": "On the right you see the same money in four ways: your savings goal (if you have one), an investment, a trip and a car deposit. It is always the same money: it is not added four times.",
    "sections": [
      {
        "label": "Simply",
        "blocks": [
          {
            "kind": "bullets",
            "items": [
              "Your goal goes first if you already created one: you see how much closer it would have got you to something you really want.",
              "Investment: how much that money would have grown at a rate and term you can change.",
              "Trip: which example trip it covered (or how much of one you were missing).",
              "Car deposit: which example car you could have started paying for or bought in cash."
            ]
          }
        ]
      },
      {
        "label": "Technical detail",
        "blocks": [
          {
            "kind": "p",
            "text": "The cards do nothing with your real money: they do not deposit, reserve or modify your goals or budgets. Trip and car prices are approximate, rounded references, per person, that give a sense of scale; they are not quotes."
          }
        ]
      }
    ]
  },
  'viaje_en_oportunidades': {
    "title": "How the trip is compared",
    "text": "We tell you which example trip that money would have covered, or how much you were missing for the next one. If you already have a trip in mind, type what it costs and we see how much of it you covered.",
    "sections": [
      {
        "label": "Technical detail",
        "blocks": [
          {
            "kind": "equation",
            "left": "Coverage",
            "right": "Starting money ÷ trip cost × 100"
          },
          {
            "kind": "p",
            "text": "The example trips (Mexico, Colombia, Canada, Europe, Japan) are approximate, rounded prices per person that include neither high season nor specific flights. Above 100 % the bar fills and the percentage can exceed 100."
          }
        ]
      }
    ]
  },
  'oportunidades_de_crecimiento': {
    "title": "What Growth Opportunities are",
    "text": "This section shows you, with a clear example, what you could have done with the money that went into spending that may not have added much, or into what you went over your budgets. It does not scold you or tell you what to spend on: it only shows, with your own numbers, what that money would have meant had it gone somewhere else.",
    "sections": [
      {
        "label": "How to read it, simply",
        "blocks": [
          {
            "kind": "bullets",
            "items": [
              "On the left you choose which money we start from: a share of everything you spent, what you went over your budgets, or the categories you want to cut.",
              "On the right you see what you could have done with that same money: get closer to your savings goal, invest it, take a trip or put down a car deposit.",
              "It is all an example to imagine with: it moves none of your money, creates no savings and promises no returns."
            ]
          }
        ]
      },
      {
        "label": "If you want to customize it",
        "blocks": [
          {
            "kind": "p",
            "text": "“Advanced mode” lets you choose which expenses to analyze (by category, sub-category, tag or description) and what share of them. Use it once the simple view makes sense."
          }
        ]
      },
      {
        "label": "Technical detail",
        "blocks": [
          {
            "kind": "p",
            "text": "Only completed expenses recorded in Gastify inside the period count. Transfers, uncompleted movements and anything that is not spending are left out. Amounts are shown in your main currency; if a conversion is missing or the history is still loading, Gastify says so."
          },
          {
            "kind": "equation",
            "left": "Starting money",
            "right": "Observed spending × the share you would have set aside"
          },
          {
            "kind": "p",
            "text": "The four ways of imagining the money use exactly that same amount: they are not added together."
          },
          {
            "kind": "example",
            "text": "If observed spending is $10,000 and you choose 10 %, the starting money is $1,000. That same $1,000 is used for the investment, the trip, the deposit and your goal's progress."
          }
        ]
      }
    ]
  },
  'parte_del_gasto': {
    "title": "What share you would have set aside",
    "text": "It is the part of the spending you imagine you would have saved instead of spending. It is not a goal Gastify sets for you: it is your own hypothesis to see what would happen.",
    "sections": [
      {
        "label": "Simply",
        "blocks": [
          {
            "kind": "example",
            "text": "If you spent $1,000 and set aside 10 %, that is $100."
          },
          {
            "kind": "p",
            "text": "Try 5 % or 10 %: it is realistic for almost everyone. You can type another percentage in the box."
          }
        ]
      },
      {
        "label": "Technical detail",
        "blocks": [
          {
            "kind": "equation",
            "left": "Starting money",
            "right": "Observed spending × percentage"
          },
          {
            "kind": "p",
            "text": "Changing the percentage alters neither your movements nor your budgets."
          }
        ]
      }
    ]
  },
  'inversion_ilustrativa': {
    "title": "How to read the investment",
    "text": "It tells you how much you would have today if that money had been invested: you set the yearly rate and the years, and we see how much it would have grown. By default we use 12 % a year for 1 year; change them to see other cases.",
    "sections": [
      {
        "label": "Simply",
        "blocks": [
          {
            "kind": "example",
            "text": "With $10,000 at 12 % a year for 1 year you would have $11,200: $1,200 more."
          },
          {
            "kind": "p",
            "text": "It is an example to imagine with, not an offer nor a promise that such a rate exists."
          }
        ]
      },
      {
        "label": "Technical detail",
        "blocks": [
          {
            "kind": "equation",
            "left": "Future value",
            "right": "Starting money × (1 + rate) ^ years"
          },
          {
            "kind": "p",
            "text": "It is plain compound interest. It ignores fees, taxes, inflation and real market swings, and it recommends no product. A negative rate is also possible and can lower the value."
          }
        ]
      }
    ]
  },
  'metas_en_oportunidades': {
    "title": "How your goal is compared",
    "text": "Only in this example, we add that money to your savings goal's progress so you can see how much closer it would have got you. Your real savings and accounts do not change.",
    "sections": [
      {
        "label": "Technical detail",
        "blocks": [
          {
            "kind": "equation",
            "left": "Simulated savings",
            "right": "Current savings + starting money"
          },
          {
            "kind": "equation",
            "left": "Simulated progress",
            "right": "Simulated savings ÷ total goal"
          },
          {
            "kind": "p",
            "text": "Current savings come from the balance of the accounts linked to the goal or from what you declared by hand. If a conversion is unavailable or the account is shared between goals, we do not show a comparison that could mislead."
          }
        ]
      }
    ]
  },
  'objetivos_de_ahorro': {
    "title": "What savings goals are for",
    "text": "A goal is something you want to achieve with your money: a car, a house, a business, a trip, an emergency fund. You create it, say how much you need and by when, and Gastify shows you how much you have and how much is left. The idea is for your money to have a direction.",
    "sections": [
      {
        "label": "How to use it, simply",
        "blocks": [
          {
            "kind": "bullets",
            "items": [
              "Create a goal and give it a name, icon and color.",
              "Tell it how much you need and, if you want, by when: we suggest how much to set aside each payment.",
              "Say how much you have: by typing the amount or by linking an account you use only for that.",
              "Watch it move on the bar: it changes color depending on how close you are.",
              "In Growth Opportunities you will see how much closer the money that slipped away would have got you."
            ]
          }
        ]
      },
      {
        "label": "Technical detail",
        "blocks": [
          {
            "kind": "equation",
            "left": "Progress",
            "right": "Recognized savings ÷ goal amount"
          },
          {
            "kind": "bullets",
            "items": [
              "If you link accounts, their balances converted to the goal's currency are added up; if not, what you declared is used. The two are never added together.",
              "An account should fund only one goal. If two goals share an account, progress is shown as provisional with an amber notice.",
              "The bar uses the same thresholds as budgets: coral below 35 %, green from 35 % to under 85 % and blue from 85 %.",
              "Related projects, categories, tags and income sources give context; they add no money and record no deposits.",
              "Editing the goal changes its setup; pausing or completing it changes its status, without erasing your progress."
            ]
          }
        ]
      }
    ]
  },
  'enganche_de_carro': {
    "title": "How the car deposit is compared",
    "text": "We tell you which example car you could have put the deposit down for (20 % of its price) or bought in cash with that money, and how close you were to the next one.",
    "sections": [
      {
        "label": "Technical detail",
        "blocks": [
          {
            "kind": "equation",
            "left": "Example deposit",
            "right": "Car price × 20 %"
          },
          {
            "kind": "p",
            "text": "It is only a mathematical comparison: not a quote, a loan or an approval. Prices are approximate, rounded references to give a sense of scale; check the current price with a dealer."
          }
        ]
      }
    ]
  },
  'fuentes_de_oportunidad': {
    "title": "Which money we start from",
    "text": "Here you choose the money we imagine you would have set aside. Tap one of the options and the right side is recalculated.",
    "sections": [
      {
        "label": "The options",
        "blocks": [
          {
            "kind": "definition",
            "term": "A share of everything you spent",
            "text": "Takes 5 % or 10 % (or the one you type) of all your spending in the period."
          },
          {
            "kind": "definition",
            "term": "What you went over your budgets",
            "text": "Adds up, budget by budget, what you spent above its limit."
          },
          {
            "kind": "definition",
            "term": "Categories you want to cut",
            "text": "The ones you chose in Categories, with the percentage you want to cut them. If you have not chosen any, we suggest some by name (such as restaurants or vices) or the category where you spend the most. It is a suggestion, not a judgment."
          }
        ]
      }
    ]
  },
  'modo_avanzado_oportunidades': {
    "title": "What advanced mode is",
    "text": "It is the version with every control: you choose which expenses to analyze (all, a category, a sub-category, a tag or a description) and what percentage to set aside. Use it once the simple view makes sense.",
    "sections": [
      {
        "label": "Technical detail",
        "blocks": [
          {
            "kind": "p",
            "text": "Advanced mode uses the same calculation as the simple view, but without the ready-made sources. You can go back whenever you want: nothing is lost."
          }
        ]
      }
    ]
  },
  'categorias_a_reducir': {
    "title": "Categories I want to cut",
    "text": "Here you tell Gastify in which categories you want to spend less and by how much (for example, Restaurants 30 %). It is only your own intention: it changes none of your movements and blocks nothing.",
    "sections": [
      {
        "label": "What it is for",
        "blocks": [
          {
            "kind": "bullets",
            "items": [
              "In Growth Opportunities those categories show first, with the saving you would have made by cutting them.",
              "The higher the percentage, the stronger your intention to cut that spending: 100 % means getting rid of it.",
              "Set 0 % and save to remove a category from the list."
            ]
          }
        ]
      }
    ]
  },
  'totales': { title: 'Totals', text: 'Income = the sum of everything that came in during the period. Expenses = the sum of everything that went out. Balance = income − expenses (green if there is a surplus, red if there is a shortfall). It is calculated with the movements you see under the active filters, in your main currency; transfers between your accounts do not count, because they neither come in nor go out of your money.' },
};
