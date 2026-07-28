const mongoose = require('mongoose');

const NEW_TXS = [
  {
    date: '2026-07-27T12:00:00Z',
    amount: 20.58,
    name: 'Uber Eats - Comida a domicilio',
    category: '659ddbcba72c4de71b9361a4', // Restaurant
    subCategory: '662c625a29d978135393e536' // Uber
  },
  {
    date: '2026-07-27T12:00:00Z',
    amount: 362.66,
    name: 'Uber Eats - Comida a domicilio',
    category: '659ddbcba72c4de71b9361a4',
    subCategory: '662c625a29d978135393e536'
  },
  {
    date: '2026-07-26T12:00:00Z',
    amount: 60.00,
    name: 'Amazon - Compra ($60.00)',
    category: '6846e28af0ba8baa09b46d21', // Electronics 📱
    subCategory: '67c1650db96242617d98e440' // Series-Movies E-Account
  },
  {
    date: '2026-07-26T12:00:00Z',
    amount: 178.00,
    name: '7-Eleven - Tienda de conveniencia',
    category: '659ddbcba72c4de71b936198', // Food
    subCategory: '662dea396598c7cfd4850ae4' // Despensa
  },
  {
    date: '2026-07-26T12:00:00Z',
    amount: 404.00,
    name: '7-Eleven - Tienda de conveniencia',
    category: '659ddbcba72c4de71b936198', // Food
    subCategory: '662dea396598c7cfd4850ae4' // Despensa
  },
  {
    date: '2026-07-26T12:00:00Z',
    amount: 345.00,
    name: 'Mercado Pago - El Santo (Restaurante)',
    category: '659ddbcba72c4de71b9361a4', // Restaurant
    subCategory: '6854b3dadee186a410624f00' // Restaurant Family
  },
  {
    date: '2026-07-25T12:00:00Z',
    amount: 1261.00,
    name: 'Walmart Super - Despensa',
    category: '659ddbcba72c4de71b936198', // Food
    subCategory: '662dea396598c7cfd4850ae4' // Despensa
  },
  {
    date: '2026-07-25T12:00:00Z',
    amount: 1118.65,
    name: 'Amazon - UGREEN Nexode Pro 160W Cargador USB Tipo C',
    category: '6846e28af0ba8baa09b46d21', // Electronics 📱
    subCategory: '662dd87a3453b9146ef1b73c' // Things for personal care
  },
  {
    date: '2026-07-25T12:00:00Z',
    amount: 1671.12,
    name: 'Amazon - Anker MagGo Estación de Carga 3 en 1 (MagSafe 15W)',
    category: '6846e28af0ba8baa09b46d21', // Electronics 📱
    subCategory: '662dd87a3453b9146ef1b73c' // Things for personal care
  },
  {
    date: '2026-07-25T12:00:00Z',
    amount: 320.15,
    name: 'Amazon - UGREEN 100W Cable USB C (2 Unidades, 2M)',
    category: '6846e28af0ba8baa09b46d21', // Electronics 📱
    subCategory: '662dd87a3453b9146ef1b73c' // Things for personal care
  },
  {
    date: '2026-07-25T12:00:00Z',
    amount: 120.00,
    name: 'OXXO - Tienda de conveniencia',
    category: '659ddbcba72c4de71b936198', // Food
    subCategory: '67edfb96d57d8bebff7169cd' // Oxxo
  },
  {
    date: '2026-07-25T12:00:00Z',
    amount: 77.48,
    name: 'Uber - Viaje de taxi',
    category: '659ddbcba72c4de71b936196', // Transport
    subCategory: '662c625a29d978135393e536' // Uber
  },
  {
    date: '2026-07-24T12:00:00Z',
    amount: 4199.00,
    name: 'Nike - Calzado y Ropa deportiva',
    category: '659ddbcba72c4de71b9361a0', // Clothes
    subCategory: '662dd87a3453b9146ef1b73c' // Things for personal care
  },
  {
    date: '2026-07-23T12:00:00Z',
    amount: 1613.41,
    name: 'Walmart Super - Despensa',
    category: '659ddbcba72c4de71b936198', // Food
    subCategory: '662dea396598c7cfd4850ae4' // Despensa
  },
  {
    date: '2026-07-23T12:00:00Z',
    amount: 179.70,
    name: 'Sumesa - Despensa',
    category: '659ddbcba72c4de71b936198', // Food
    subCategory: '662dea396598c7cfd4850ae4' // Despensa
  },
  {
    date: '2026-07-22T12:00:00Z',
    amount: 344.41,
    name: 'Amazon - Compra ($344.41)',
    category: '6846e28af0ba8baa09b46d21', // Electronics 📱
    subCategory: '662dd87a3453b9146ef1b73c' // Things for personal care
  }
];

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);

  const txSchema = new mongoose.Schema({
    name: String,
    amount: Number,
    date: Date,
    isIncome: Boolean,
    isBill: Boolean,
    isReadable: Boolean,
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    wallet: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory' }
  }, { strict: false });

  const TX = mongoose.models.Transaction || mongoose.model('Transaction', txSchema);

  const accountId = new mongoose.Types.ObjectId('65ea3b0a81e22fd40d2078c3'); // HSBC 2NOW🇨🇭
  const userId = new mongoose.Types.ObjectId('659ddbcda72c4de71b9361b5');
  const walletId = new mongoose.Types.ObjectId('659ddbcda72c4de71b9361b6');

  console.log(`Checking for existing duplicates before inserting ${NEW_TXS.length} transactions...`);

  let createdCount = 0;
  for (let item of NEW_TXS) {
    // Prevent duplicate insertion if run twice
    const existing = await TX.findOne({
      account: accountId,
      amount: item.amount,
      name: item.name
    });

    if (existing) {
      console.log(`[SKIP] Already exists in DB: ${item.name} ($${item.amount})`);
      continue;
    }

    const newDoc = new TX({
      name: item.name,
      amount: item.amount,
      date: new Date(item.date),
      isIncome: false,
      isBill: true,
      isReadable: true,
      account: accountId,
      user: userId,
      wallet: walletId,
      category: new mongoose.Types.ObjectId(item.category),
      subCategory: new mongoose.Types.ObjectId(item.subCategory),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newDoc.save();
    console.log(`[CREATED] ${newDoc._id} -> ${item.date.slice(0, 10)} | $${item.amount} | "${item.name}"`);
    createdCount++;
  }

  console.log(`\nAll done! Successfully created ${createdCount} new July 2026 transactions in MongoDB.`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
