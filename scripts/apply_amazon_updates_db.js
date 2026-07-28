const mongoose = require('mongoose');

const UPDATES = [
  { id: '69e2e1afa69914bd1b1d2aa5', name: 'Amazon - Membresía Prime Mensual' },
  { id: '69e2e1afa69914bd1b1d2aad', name: 'Amazon - Antifaz para dormir' },
  { id: '69e2e1afa69914bd1b1d2abb', name: 'Amazon - UGREEN Cable USB C a C 90 Grados (3M, 60W)' },
  { id: '69e2e1afa69914bd1b1d2ad8', name: 'Amazon - Peace&Quiet Tapones de Cera para Dormir (15 pzs)' },
  { id: '69e2e1afa69914bd1b1d2ad9', name: 'Amazon - UGREEN Cable USB C a USB C (3M, 60W PD)' },
  { id: '69e2e1afa69914bd1b1d2ae9', name: 'Amazon - Samsung T7 Shield 4TB, Portable SSD' },
  { id: '69e2e1afa69914bd1b1d2ae7', name: 'Amazon - Anker Power Bank 25,000 mAh (165W, 3 puertos)' },
  { id: '69e2e1afa69914bd1b1d2ae8', name: 'Amazon - ProGrade Digital Tarjeta SDXC UHS-II V90 (256GB)' },
  { id: '69e2e1afa69914bd1b1d2af3', name: 'Amazon - LEVEL8 Textura Maletas de Viaje (28")' },
  { id: '69e2e1afa69914bd1b1d2af1', name: 'Amazon - travel inspira Báscula de Equipaje Digital Portátil' },
  { id: '69e2e1afa69914bd1b1d2afe', name: 'Amazon - Membresía Prime Mensual' },
  { id: '6a66ea33277e43c0f049e980', name: 'Amazon - Lexar Professional USB 3.2 Tipo-C Lector Doble Ranura' },
  { id: '6a66ea33277e43c0f049e983', name: 'Amazon - Compra ($179.54)' }
];

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);

  const txSchema = new mongoose.Schema({
    name: String,
    amount: Number,
    date: Date
  }, { strict: false });

  const TX = mongoose.models.Transaction || mongoose.model('Transaction', txSchema);

  console.log(`Applying ${UPDATES.length} Amazon transaction name updates in MongoDB...`);
  let successCount = 0;

  for (let u of UPDATES) {
    const res = await TX.updateOne({ _id: u.id }, { $set: { name: u.name } });
    if (res.modifiedCount === 1 || res.matchedCount === 1) {
      console.log(`[SUCCESS] Updated ${u.id} -> "${u.name}"`);
      successCount++;
    } else {
      console.warn(`[WARNING] Could not match/modify ${u.id}`);
    }
  }

  console.log(`\nAll done! Successfully updated ${successCount}/${UPDATES.length} transactions in MongoDB.`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
