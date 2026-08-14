// Seeds CategoryRule documents for a single user's wallet from a curated,
// corrected version of .mds/NAMING_RULES.json's category assignments.
// NOT auto-run - review before executing. See .mds/AI_COORDINATION_LOG.md for the
// audit that drove each change (broken subCategory refs, Uber/Uber Eats collision,
// Peajes/Gasolina mixup, redundant catch-all rules overlapping dedicated ones).
//
// Usage: MONGODB_URI=... USER_MAIL=gsfrido10@gmail.com node scripts/seed_category_rules.js

const mongoose = require('mongoose');

const USER_MAIL = process.env.USER_MAIL || 'gsfrido10@gmail.com';

// { pattern, minAmount?, maxAmount?, category, subCategory?, priority, confidence? }
// priority: higher = evaluated first. Specific/narrow rules MUST outrank the
// generic rules they could otherwise collide with (see Uber/Uber Eats, Cinepolis).
const RULES = [
  // --- Transport ---
  { pattern: 'UBER\\s*EATS', category: 'Restaurant', subCategory: 'Rappi y Diddi', priority: 20 },
  { pattern: 'DIDI\\s*FOOD|OPENPAY\\*DIDI\\s*FOOD', category: 'Restaurant', subCategory: 'Rappi y Diddi', priority: 20 },
  { pattern: 'RAPPI|RAPPIPRO|DLO\\*RAPPIPRO', category: 'Restaurant', subCategory: 'Rappi y Diddi', priority: 10 },
  { pattern: 'UBER|UBRPAGOSMEX|PAYPAL\\*UBR|STR\\*UBER|UBR\\*|DLO\\*UBER', category: 'Transport', subCategory: 'Uber', priority: 5 },
  { pattern: 'DIDI|OPENPAY\\*DIDI|D\\s*LOCAL\\s*DIDI', category: 'Transport', subCategory: 'Uber', priority: 5 },
  { pattern: 'ETN|AUTOB\\s*FOR', category: 'Transport', subCategory: 'Uber', priority: 10 },
  // Peajes/estacionamiento: NOT gasoline. No matching subCategory exists yet -
  // category-only until/unless a dedicated one gets created.
  { pattern: 'SENDEROS|SUPERVOY|LUCERNA|ECA\\s*LEON', category: 'Transport', priority: 10 },
  { pattern: 'MARIN\\s*NACIONAL|GASOLINERA|PEMEX|LMU\\s*MARIN', category: 'Car', subCategory: 'Gasolina', priority: 10 },

  // --- E-accounts (subscriptions) ---
  { pattern: 'SPOTIFY', category: 'E-accounts', subCategory: 'Music (Spotify - Apple Music - Amazon Music)', priority: 10 },
  { pattern: 'ANTHROPIC CLAUDE', category: 'E-accounts', subCategory: 'IA Tools', priority: 10 },
  { pattern: 'OPENAI|CHATGPT', category: 'E-accounts', subCategory: 'IA Tools', priority: 10 },
  { pattern: 'GOOGLE\\s*GOOGLE|GOOGLE\\s*GEMINI', category: 'E-accounts', subCategory: 'IA Tools', priority: 10 },
  { pattern: 'MICROSOFT', category: 'E-accounts', subCategory: 'IA Tools', priority: 10 },
  { pattern: 'HELPHBOMAX|HBO\\s*MAX', category: 'Entertainment', subCategory: 'Series-Movies E-Account ', priority: 10 },
  { pattern: 'NETFLIX', category: 'Entertainment', subCategory: 'Series-Movies E-Account ', priority: 10 },
  { pattern: 'ITUNES|APPLE\\.COM', category: 'E-accounts', subCategory: 'Apple', priority: 10 },
  // Amazon Prime: exact-amount rule must outrank the generic Amazon-purchase rule.
  { pattern: 'AMAZON|ANE 140618P37', minAmount: 99, maxAmount: 99, category: 'Entertainment', subCategory: 'Series-Movies E-Account ', priority: 20 },
  { pattern: 'MELIMAS|MERPAGO\\*MELIMAS', minAmount: 299, maxAmount: 299, category: 'Entertainment', subCategory: 'Series-Movies E-Account ', priority: 20 },
  { pattern: 'STR\\*AMAZON|AMAZON\\s*CIU|AMAZON', category: 'Tienda', priority: 5 },

  // --- Entertainment ---
  { pattern: 'CINEPOLIS|PPCINEPOLIS', category: 'Entertainment', subCategory: 'Cine', priority: 15, confidence: 'low' },
  { pattern: 'CINEMEX', category: 'Entertainment', subCategory: 'Cine', priority: 15, confidence: 'low' },
  // Narrowed: no longer swallows Cinepolis/Cinemex (they have their own rules above).
  { pattern: 'ETKBOLET|BOLETOS', category: 'Entertainment', priority: 5 },

  // --- Food / groceries ---
  { pattern: 'CHEDRAUI|WALMART|LA\\s*COMER|SUMESA|NWM 9709244W4', category: 'Food', subCategory: 'Despensa', priority: 10 },
  { pattern: 'WILDFORK|WILD\\s*FORK|WILFORK', category: 'Food', subCategory: 'Proteina 🍗', priority: 10 },
  { pattern: 'OXXO|7\\s*ELEVEN|7-ELEVEN|7ELEVEN', category: 'Tienda', subCategory: 'Oxxo', priority: 10 },
  { pattern: 'MERCADOPAGO\\s*\\*(TACOSLON|BARBACDO|CREPASLA|BIRRIAPI|ELCHAMA|JAIMERAF|TACTICAL)|TACOS|BIRRIA|BARBACOA|CREPAS', category: 'Restaurant', priority: 10, confidence: 'low' },

  // --- Health ---
  { pattern: 'HD\\s*SPORT|SPORT\\s*FITNES|BLACK\\s*ENERGY\\s*GYM', category: 'Gym', subCategory: 'Coach gym', priority: 10 },
  { pattern: 'HOLIDAY\\s*INN\\s*BUENAVIS', category: 'Gym', subCategory: 'Coach gym', priority: 10 },
  { pattern: 'PUNTO\\s*CLINICO\\s*DOCTORES', minAmount: 700, category: 'Health', priority: 15 },
  { pattern: 'GASTROCLIN', category: 'Health', priority: 10 },
  { pattern: 'DR\\s*RAUL\\s*MORALES', category: 'Health', priority: 15 },
  { pattern: 'SERV\\s*MED\\s*CUAUHTEMOC', category: 'Health', priority: 15 },
  { pattern: 'F\\.?\\s*AHORRO|FARMACIAS DEL AHORRO', category: 'Health', subCategory: 'Pills', priority: 10 },
  { pattern: 'PHARMA SUC JUAREZ', category: 'Health', subCategory: 'Pills', priority: 10 },
  { pattern: 'CORTE DE PELO CEJAS', category: 'Health Care', subCategory: 'Hair cut', priority: 15 },

  // --- Clothes (low confidence - department stores sell many kinds of things) ---
  { pattern: 'INNVICTUS REFORMA 222|INVICTUS REFORMA 222', category: 'Clothes', priority: 15 },
  { pattern: 'LUST MAZARYK|LUST MASARYK', category: 'Clothes', priority: 15 },
  { pattern: 'BC MASARYK', category: 'Clothes', priority: 15 },
  { pattern: 'PULL&BEAR|PULL AND BEAR', category: 'Clothes', priority: 15 },
  // Narrowed: no longer includes Invictus (has its own rule above).
  { pattern: 'SEARS|LIVERPOOL|PALACIO\\s*DE\\s*HIERRO|IS\\s*BUENAVISTA', category: 'Clothes', priority: 5, confidence: 'low' },

  // --- House ---
  { pattern: 'OPENPAY ROTOPLAS SERVI|ROTOPLAS SERVI', category: 'House', subCategory: 'House services', priority: 10 },
  { pattern: 'NATURGY', category: 'House', subCategory: 'House services', priority: 10 },
  { pattern: 'TELMEX', category: 'House', subCategory: 'House services', priority: 10 },
  { pattern: 'SEGIAGUA|SEGUAGUA', category: 'House', subCategory: 'House services', priority: 10 },
  { pattern: 'CFE|MERCADOPAGO\\s*\\*CFE', category: 'House', subCategory: 'Electricity ⚡️ ', priority: 10 },
  { pattern: 'TELEFONICA|TELEFÓNICA|MOVISTAR', category: 'Services', subCategory: 'Phone rent ', priority: 10 },
  { pattern: '^GAS$', category: 'House', subCategory: 'Gas', priority: 10 },

  // --- Taxes / Services ---
  { pattern: 'SU PAGO GRACIAS|PAGO POR TRANSFERENCIA|CARGO PAGO TARJETA CREDITO|PAGO TNOW|TRANSFERENCIA A CUENTA HSBC', category: 'Services', priority: 10 },
  { pattern: 'IMPTO FED TRANSF ELECT|CGO IMPTO FED', category: 'Taxes', subCategory: 'Goverment', priority: 15 },
  { pattern: 'RETENCION\\s*I\\s*S\\s*R|PAGO.*SAT', category: 'Taxes', subCategory: 'Goverment', priority: 5 },
  { pattern: 'GABY CONTADORA', category: 'Taxes', subCategory: 'Contador', priority: 15 },
  { pattern: 'CONSULTA ABOGADO', category: 'Abogado', priority: 15 },

  // --- Income / cash ---
  // fixed: was "Efectivo" (doesn't exist) - real category is "Retiro efectivo"
  { pattern: 'RETIRO\\s*EFEC|RETIRO.*ATM', category: 'Retiro efectivo', priority: 10 },
  { pattern: 'ABONO\\s*TRANSFERENCIA|ABONO\\s*NOMINA|TRANSFERENCIA\\s*SPEI.*(ABONO|PAGO DE NOMINA)', category: 'Incomes', priority: 10 },
  { pattern: 'ABO\\s*POR\\s*INTERESES|INTERESES.*PERIODO', category: 'Incomes', priority: 10 },
  { pattern: 'PAGO\\s*TRANSF|PAGO\\s*TRANSFERENCIA\\s*SPEI', category: 'Services', priority: 5 },
  // fixed: was "Salary" (doesn't exist) - real category is "Salary | Nomina"
  { pattern: 'NOMINA TEF PAGO DE NOMINA|Nomina octaura|Octaura nomina', category: 'Salary | Nomina', priority: 15 },

  // --- Electronics ---
  { pattern: 'PLAY 5 EMI', category: 'Electronics 📱', priority: 15 },
  { pattern: 'transfe laptop', category: 'Electronics 📱', priority: 15 },

  // DROPPED from the original file (not seeded, see audit notes):
  // - consumo_tarjeta_generico: "CONSUMO LOCAL AJENO" is a generic bank message
  //   for any other-acquirer charge, not an Amazon-specific signal. Forcing it to
  //   subCategory "Amazon" was a real logic bug, not a naming issue.
  // - mercadolibre_compra ("MERPAGO*MERCADOLIBRE"): folded into no rule for now -
  //   revisit once MercadoLibre transaction samples are available to disambiguate
  //   from other MERPAGO* merchants.
  // - Duplicate entries removed: walmart_groceries/la_comer_groceries/sumesa_groceries
  //   (covered by the single Food/Despensa rule above), wild_fork_protein (duplicate
  //   of wildfork_protein_fix), oxxo_convenience/seven_eleven_convenience (duplicates
  //   of oxxo_7eleven_general, and the duplicates had a wrong/missing category).
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const userSchema = new mongoose.Schema({ mail: String, wallet: mongoose.Schema.Types.ObjectId }, { strict: false });
  const catSchema = new mongoose.Schema({ name: String, user: mongoose.Schema.Types.ObjectId, wallet: mongoose.Schema.Types.ObjectId, isDefaultCatego: Boolean }, { strict: false });
  const subCatSchema = new mongoose.Schema({ name: String, user: mongoose.Schema.Types.ObjectId, wallet: mongoose.Schema.Types.ObjectId, fatherCategory: mongoose.Schema.Types.ObjectId, isDefaultSubCatego: Boolean }, { strict: false });
  const ruleSchema = new mongoose.Schema({}, { strict: false, timestamps: true });

  const User = mongoose.models.User || mongoose.model('User', userSchema);
  const Category = mongoose.models.Category || mongoose.model('Category', catSchema);
  const SubCategory = mongoose.models.SubCategory || mongoose.model('SubCategory', subCatSchema);
  const CategoryRule = mongoose.models.CategoryRule || mongoose.model('CategoryRule', ruleSchema);

  const user = await User.findOne({ mail: USER_MAIL }).lean();
  if (!user) throw new Error(`User not found: ${USER_MAIL}`);

  const categories = await Category.find({ $or: [{ user: user._id }, { isDefaultCatego: true }] }).lean();
  const subCategories = await SubCategory.find({ $or: [{ user: user._id }, { isDefaultSubCatego: true }] }).lean();

  const catByName = new Map(categories.map((c) => [c.name.trim().toLowerCase(), c._id]));
  const subByName = new Map(subCategories.map((s) => [s.name.trim().toLowerCase(), s._id]));

  const docs = [];
  const unresolved = [];

  for (const rule of RULES) {
    const categoryId = rule.category ? catByName.get(rule.category.trim().toLowerCase()) : null;
    const subCategoryId = rule.subCategory ? subByName.get(rule.subCategory.trim().toLowerCase()) : null;

    if (rule.category && !categoryId) unresolved.push(`category not found: "${rule.category}" (pattern: ${rule.pattern})`);
    if (rule.subCategory && !subCategoryId) unresolved.push(`subCategory not found: "${rule.subCategory}" (pattern: ${rule.pattern})`);

    docs.push({
      user: user._id,
      wallet: user.wallet,
      pattern: rule.pattern,
      minAmount: rule.minAmount,
      maxAmount: rule.maxAmount,
      category: categoryId || undefined,
      subCategory: subCategoryId || undefined,
      priority: rule.priority || 0,
      confidence: rule.confidence || 'high',
      source: 'seed',
      timesApplied: 0,
    });
  }

  if (unresolved.length > 0) {
    console.log('=== UNRESOLVED (would be seeded without that field) ===');
    unresolved.forEach((u) => console.log('  ' + u));
  }

  console.log(`\nWould insert ${docs.length} CategoryRule documents for ${USER_MAIL}.`);
  console.log('DRY RUN - not inserting. Pass --confirm to actually write.');

  if (process.argv.includes('--confirm')) {
    await CategoryRule.deleteMany({ wallet: user.wallet, source: 'seed' });
    await CategoryRule.insertMany(docs);
    console.log(`Inserted ${docs.length} rules.`);
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
