// Every explanation the app shows with a "?", in English. Same keys and same shape as ../appInfo.ts (a test keeps them in step):
// the Spanish file is the source, this one is the English version of each text, with the same tables, equations and examples.
import type { InfoBlock, InfoSection, InfoText } from '../createInfo';

export type { InfoBlock, InfoSection, InfoText };

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
  'movimientos_de_la_cuenta': { title: 'Account movements', text: 'What came in and went out of this account in the chosen period, and its most recent movements. Transfers between your accounts do not count as income or expenses.' },
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
    title: 'What the analysis period is for',
    text: 'Growth Opportunities does not label your spending as good or bad, and it does not assume that everything you spent could have been saved. Its purpose is to make opportunity cost visible: to help you imagine what part of that spending might mean if you chose to direct it toward another priority.',
    sections: [
      { label: 'The idea behind the analysis', blocks: [
        { kind: 'p', text: 'The period defines the sample of your history used as a starting point. The question is not “where did I spend badly?” but “if some of this spending had gone somewhere else, what possibility might it have opened for me?”' },
        { kind: 'p', text: 'The goal is to turn past movements into a useful perspective for future decisions and goals. This is a reflection tool, not a scolding or a recommendation to eliminate a particular expense.' },
      ] },
      { label: 'How to read the results', blocks: [
        { kind: 'bullets', items: [
          'Observed spending is the amount of expenses matching the period and filters. It is shown in your main currency; the counter shows how many movements match.',
          'The percentage you choose is a scenario: start with 5% or 10%, then adjust it if you wish. It is not a budget limit or money already set aside.',
          'The cards below use that same hypothetical amount to illustrate alternatives such as investing, travel, or progress toward a savings goal.',
          'Refunds and fees are shown separately. Movements without an available conversion are not added to the total, and the page flags data or exchange rates that may need review.',
        ] },
      ] },
      { label: 'How it is calculated—and what it does not mean', blocks: [
        { kind: 'bullets', items: [
          'The current month, quarter, and year begin on the first day of that period and run through today. For Custom, you choose both dates; the start and end days are included.',
          'It considers expense, refund, or fee movements recorded in Gastify within those dates; movements with a status other than completed are excluded. Category, subcategory, tag, or concept filters can then narrow the set.',
          'Scenarios are hypothetical: they do not move money, create savings, or promise returns. The investment example uses the rate and horizon you enter; it is for comparison, not a prediction.',
          'Changing dates or filters only recalculates the view. It does not edit or delete your movements.',
        ] },
      ] },
    ],
  },
  'filtros_de_oportunidades': {
    title: 'What “Analyze by” means',
    text: 'Choose which part of your spending to review. This does not edit transactions or decide which expenses are good or bad.',
    sections: [{ label: 'Options', blocks: [
      { kind: 'definition', term: 'All expenses', text: 'Looks at recorded expenses in the period. Imagining 5% or 10% does not mean all spending was avoidable.' },
      { kind: 'definition', term: 'Category or subcategory', text: 'Focuses on a group such as Restaurants. Use it to review a habit, not to label it unnecessary.' },
      { kind: 'definition', term: 'Tag', text: 'Groups movements with the same tag, even across different categories.' },
      { kind: 'definition', term: 'Concept', text: 'Searches words in the transaction name, such as a merchant. Review the matches: similar names can represent different spending.' },
      { kind: 'p', text: 'The period applies first; the filter then narrows the movements. Only expenses with an amount in your main currency are added. Refunds and fees appear separately.' },
    ] }],
  },
  'tres_alternativas_de_ese_monto': {
    title: 'Three alternatives for the same amount',
    text: 'These cards place the same reference amount in three contexts to help you imagine options. They are not three separate amounts and are not added together.',
    sections: [
      { label: 'How to read each card', blocks: [
        { kind: 'table', head: ['Alternative', 'What it shows', 'What it does not do'], rows: [
          ['Illustrative investment', 'Two mathematical calculations with an editable rate and term.', 'It is not a real investment, offer or guaranteed return.'],
          ['Trip', 'What share of an editable target the amount could cover.', 'It does not search prices, quote or book a trip.'],
          ['Down payment or another goal', 'How progress toward your goal would change in a simulation only.', 'It does not deposit money or change the saved goal.'],
        ] },
      ] },
    ],
  },
  'viaje_en_oportunidades': {
    title: 'How the sample trip is compared',
    text: 'The card divides the reference amount by the estimated cost you enter. The result is a mathematical proportion, not a quote or spending recommendation.',
    sections: [
      { label: 'Reading the bar', blocks: [
        { kind: 'equation', left: 'Estimated coverage', right: 'Reference amount ÷ trip target × 100' },
        { kind: 'p', text: 'If the result exceeds 100%, the bar fills, although the displayed percentage can exceed the target. Change the sample amount to compare another scenario; the edit only exists on this screen.' },
      ] },
    ],
  },
  'oportunidades_de_crecimiento': {
    title: 'How to read Growth Opportunities',
    text: 'This analysis does not claim you should have spent less or that the money is still available. It is a thought exercise that adds context to expenses you already recorded and explores possible alternatives.',
    sections: [
      { label: '1. Period and filters', blocks: [
        { kind: 'p', text: 'The period determines which dates are reviewed. Month, quarter and year-to-date end today; Custom uses the dates you choose. “Analyze by” filters those movements by category, subcategory, tag or matching concept text. It does not change, edit or create transactions.' },
        { kind: 'p', text: 'Only completed expenses recorded in Gastify within the range count. Transfers, non-completed movements and non-expense items are excluded. Amounts are shown in your primary currency; Gastify flags missing conversions or incomplete history.' },
      ] },
      { label: '2. Observed spending and percentage', blocks: [
        { kind: 'equation', left: 'Observed spending', right: 'Sum of expenses matching the period and filters' },
        { kind: 'equation', left: 'Alternative amount', right: 'Observed spending × selected share' },
        { kind: 'p', text: 'The percentage buttons are not ratings, alerts, or returns: they ask “what if I set aside this share of that spending?” The simple view suggests 5% or 10%; Customize offers larger shares. For example, 10% of $1,000 is $100.' },
      ] },
      { label: '3. Three alternatives, the same money', blocks: [
        { kind: 'table', head: ['Alternative', 'What it represents', 'What it does not mean'], rows: [
          ['Illustrative investment', 'A mathematical calculation using an annual rate and term you choose.', 'Not an offer, recommendation or guaranteed return. Fees and taxes are not included.'],
          ['Trip or other purchase', 'The alternative amount compared with an editable sample goal.', 'Not a quote; nothing is booked or paid.'],
          ['Personal goal', 'The alternative amount added only in this simulation to the progress of a selected savings goal.', 'It does not deposit money into your accounts or change the real goal.'],
        ] },
        { kind: 'p', text: 'The investment shows two different readings: “if this amount were available today” models it as a single deposit from today; “if you set aside each expense when it happened” keeps the original expense dates. That is why their results can differ.' },
      ] },
      { label: 'How to read an example', blocks: [
        { kind: 'example', text: 'If observed spending is $10,000 and you choose 10%, the alternative amount is $1,000. The cards show different possibilities for that same $1,000, not three separate pots of money.' },
      ] },
    ],
  },
  'parte_del_gasto': {
    title: 'What the share means',
    text: 'The large total is the observed spending that matches the period and filters. The share is a hypothesis you choose to explore an alternative, not an amount Gastify thinks you should have saved.',
    sections: [
      { label: 'Calculation', blocks: [
        { kind: 'equation', left: 'Alternative amount', right: 'Observed spending × selected share' },
        { kind: 'table', head: ['Selection', 'If observed spending were $1,000'], rows: [['5%', '$50'], ['10%', '$100'], ['25%', '$250']] },
        { kind: 'p', text: 'The current selection appears as the highlighted amount and feeds all three alternatives. Changing it does not alter transactions or budgets.' },
      ] },
    ],
  },
  'inversion_ilustrativa': {
    title: 'How to read the illustrative investment',
    text: 'This is a compound-interest simulation, not an account or investment offer. The rate and term are editable assumptions to show how time and return affect the example.',
    sections: [
      { label: 'Two ways to model the same spending', blocks: [
        { kind: 'table', head: ['Line', 'Assumption'], rows: [
          ['If the amount were available today', 'The full alternative amount is treated as a single deposit made today and grows for the full term.'],
          ['If each expense had been set aside when it happened', 'Each part of the alternative amount is treated as set aside on the expense date and grows from that date until today.'],
        ] },
        { kind: 'equation', left: 'Illustrative value', right: 'Modeled principal + hypothetical return' },
        { kind: 'p', text: 'The green amount in parentheses is only the return produced by that assumption; the main amount includes principal. Changing the rate or term recalculates the example. A negative rate is also possible and may reduce the value.' },
        { kind: 'p', text: 'Fees, taxes, inflation and actual market changes are not included. It does not predict results, recommend products or move money.' },
      ] },
    ],
  },
  'metas_en_oportunidades': {
    title: 'How a goal is compared',
    text: 'The comparison uses the savings goal you select and shows the change only as a hypothesis. Actual savings and linked accounts stay unchanged.',
    sections: [
      { label: 'What simulated progress means', blocks: [
        { kind: 'equation', left: 'Simulated savings', right: 'Currently recognized savings + alternative amount' },
        { kind: 'equation', left: 'Simulated coverage', right: 'Simulated savings ÷ goal target' },
        { kind: 'p', text: 'Currently recognized savings comes from the balances of accounts linked to the goal, or from the recorded savings amount, depending on the goal setup. If an account conversion is unavailable or an account is shared across goals, the app avoids a potentially misleading comparison.' },
        { kind: 'p', text: 'The added amount exists only in this calculation. It is not transferred to an account, does not change saved progress, and can exceed the target; the visual bar is capped at 100%.' },
      ] },
    ],
  },
  'objetivos_de_ahorro': {
    title: 'How savings goals work',
    text: 'A goal gives a name and direction to something you want to achieve: a trip, a car, your business, or an emergency fund. You can see what remains and which steps bring you closer.',
    sections: [
      { label: 'How to use it', blocks: [
        { kind: 'bullets', items: [
          'Choose what you want to achieve and how much you need. Add a date if you want to see a contribution plan.',
          'Report what you have saved or link a dedicated account. The bar shows progress toward your chosen amount.',
          'You can change the target, date, and plan as your circumstances change. Pausing does not erase progress.',
          'Growth Opportunities can compare a hypothetical amount with your goal, but it does not add real money or change actual progress.',
        ] },
      ] },
      { label: 'How progress is calculated and why it may be provisional', blocks: [
        { kind: 'equation', left: 'Progress', right: 'Recognized savings ÷ goal target' },
        { kind: 'bullets', items: [
          'When you link eligible accounts, their balances are converted to the goal currency and added. If no accounts are linked, we use the savings amount you reported manually; the two sources are never combined.',
          'An account should fund only one goal. If legacy savings share accounts, the page shows the linked balance provisionally and uses an amber warning. That balance may appear in more than one goal, so it is not exclusive progress until each account is assigned to one goal.',
          'The savings bar keeps the same thresholds as Budgets: coral below 35%, green from 35% to under 85%, and blue at 85% or more. Reaching or exceeding the goal stays blue; the face reflects the same progress.',
          'If an account or its conversion is missing, or the account is not eligible, the app does not guess progress. Review the funding source in “Edit goal”.',
          'Related projects, expenses, categories, tags and income sources add context; they are not added to saved balances and do not record deposits automatically.',
        ] },
        { kind: 'p', text: 'Editing changes the goal setup; pausing or completing it changes its status. Growth Opportunities adds an amount only to a simulation and does not change this balance.' },
      ] },
    ],
  },
  'totales': { title: 'Totals', text: 'Income = the sum of everything that came in during the period. Expenses = the sum of everything that went out. Balance = income − expenses (green if there is a surplus, red if there is a shortfall). It is calculated with the movements you see under the active filters, in your main currency; transfers between your accounts do not count, because they neither come in nor go out of your money.' },
};
