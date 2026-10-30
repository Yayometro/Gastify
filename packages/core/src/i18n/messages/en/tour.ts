import type tour from "../es/tour";

// English for the "tour" namespace. Same keys as the Spanish catalog.
const en: Record<keyof typeof tour, string> = {
  "tour.ui.next": "Next",
  "tour.ui.prev": "Back",
  "tour.ui.done": "Done",
  "tour.ui.close": "Close tutorial",
  "tour.ui.progress": "{p1} of {p2}",
  "tour.ui.progressOpen": "Step {p1}",
  "tour.ui.nextSection": "Next section",
  "tour.ui.fullTour": "Full tour",
  "tour.ui.sectionOf": "Section {p1} of {p2}",
  "tour.ui.button": "Tutorial",
  "tour.ui.hint": "Guided tours: of this page or of the whole app.",

  "tour.menu.title": "Tutorial",
  "tour.menu.subtitle": "Choose how you want to go through Gastify.",
  "tour.menu.page": "This page",
  "tour.menu.pageHint": "I show you the most important parts of what you see now.",
  "tour.menu.basics": "How to get around",
  "tour.menu.basicsHint": "The navigation bar and the main buttons.",
  "tour.menu.full": "Full tour",
  "tour.menu.fullHint": "We go through every section, one by one.",
  "tour.menu.noPage": "This page has no tutorial of its own, but you can take the full tour.",
  "tour.menu.components": "In-depth tutorials of this page",
  "tour.menu.componentsHint": "Each section, control by control.",
  "tour.menu.close": "Close",

  "tour.tip.label": "Tutorial: {p1}",

  "tour.common.infoTip.title": "The question marks (?)",
  "tour.common.infoTip.body": "Each “?” explains what is in front of you: what a number means, where it comes from and how it is calculated. Tap it (or hover over it) whenever something is not clear: it is the fastest way to understand Gastify.",
  "tour.common.tutorialTip.title": "Tutorial buttons",
  "tour.common.tutorialTip.body": "This button with a compass starts the step-by-step tutorial of this page. Next to the title of each section there is another one: it explains that section in depth, control by control.",

  "tour.page.intro": "Welcome",

  "tour.intro.welcome.title": "Welcome to Gastify",
  "tour.intro.welcome.body": "In one minute I'll show you how to get around: where each section is and how to record a transaction. You can leave whenever you want with Esc or the X.",
  "tour.intro.bar.title": "Your navigation bar",
  "tour.intro.bar.body": "Each icon takes you to a section: Transactions, Wallet, Budgets, Projections, Analyzer, Accounts, History and Categories. On a phone, the arrow on the bar opens the rest.",
  "tour.intro.add.title": "Record a transaction",
  "tour.intro.add.body": "The “+” button creates an expense, an income, a transfer, an account or a budget. Starting here is the most useful thing: your overview builds itself.",
  "tour.intro.notifications.title": "Your alerts",
  "tour.intro.notifications.body": "Alerts about your budgets arrive here when they get close to the limit: at 70, 80, 90 and 100%.",
  "tour.intro.profile.title": "Your profile",
  "tour.intro.profile.body": "Your photo, your language, your country, light or dark mode, the tutorial (open it whenever you want from here), your account security and the connection to your AI live here.",










  "tour.resume.title": "Let's continue your tutorial",
  "tour.resume.text": "You stopped half way through the tour. Do you want to continue where you left off or start over?",
  "tour.resume.continue": "Continue where I left off",
  "tour.resume.restart": "Start over",
  "tour.resume.later": "Not now",
  "tour.resume.never": "Don't show again",

  "tour.announce.title": "New: guided tutorial",
  "tour.announce.text": "Gastify can now show you each section step by step. You find it in the “?” button of the bar and in your Profile.",
  "tour.announce.start": "See the full tour",
  "tour.announce.dismiss": "Got it",

  "tour.demoGuide.start": "Guided tour",
  "tour.demoGuide.startLabel": "Start the guided tour of this page",

  "tour.profileCard.title": "Tutorial",
  "tour.profileCard.text": "Go over Gastify step by step, even if you already use it.",
  "tour.profileCard.full": "See the full tour",
  "tour.profileCard.basics": "Repeat the welcome",
  "tour.profileCard.stop": "Don't show the tutorial automatically",
  "tour.profileCard.stopped": "Done: the tutorial will no longer open on its own. You can see it whenever you want.",
  "tour.profileCard.menu": "Open the tutorial menu",
  "profile.appearance.title": "Appearance",
  "profile.appearance.text": "Choose how Gastify looks.",
  "profile.appearance.dark": "Dark",
  "profile.appearance.light": "Light",
};

export default en;
