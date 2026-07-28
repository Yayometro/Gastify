const fs = require('fs');
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const txSchema = new mongoose.Schema({
    name: String,
    amount: Number,
    date: Date,
    isBill: Boolean,
    isIncome: Boolean,
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    wallet: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet' }
  }, { strict: false });

  const TX = mongoose.models.Transaction || mongoose.model('Transaction', txSchema);

  // Load Amazon orders extracted from screenshots
  const orders = JSON.parse(fs.readFileSync('/Users/luisjairvazqueznavarrete/Documents/Estados de cuenta /amazon_orders_temp.json', 'utf8'));

  const start = new Date('2025-11-25T00:00:00.000Z');
  const end = new Date('2026-02-01T23:59:59.999Z');

  const dbTxs = await TX.find({
    date: { $gte: start, $lte: end },
    $or: [
      { name: { $regex: 'amazon|amzn|prime|ane 1406|str\\*amazon', $options: 'i' } }
    ]
  }).sort({ date: 1 });

  console.log(`Found ${dbTxs.length} Amazon transactions in MongoDB.`);

  const results = [];

  for (let tx of dbTxs) {
    const dateStr = tx.date ? tx.date.toISOString().slice(0, 10) : 'N/A';
    const amount = tx.amount;
    const currentName = tx.name;

    // Check if we can find a matching order by amount (tolerance 0.10) and date (+/- 7 days)
    let matchedOrder = null;
    let minDaysDiff = 999;

    for (let ord of orders) {
      if (Math.abs(ord.amount - amount) < 0.10) {
        const ordDate = new Date(ord.date);
        const txDate = new Date(dateStr);
        const diffDays = Math.abs((txDate - ordDate) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7 && diffDays < minDaysDiff) {
          matchedOrder = ord;
          minDaysDiff = diffDays;
        }
      }
    }

    let proposedName = currentName;
    let action = 'NO_CHANGE_NEEDED';
    let notes = '';

    // If currentName is generic ('Amazon - Stripe', 'Amazon - Compra', 'Amazon - Compra Amazon', etc.)
    const isGeneric = /^(Amazon\s*-\s*(Stripe|Compra)|Amazon|AMAZON PRIME|ANE 140618P37|Amazon - Compra Amazon)$/i.test(currentName.trim());

    if (matchedOrder) {
      // Clean product name for readability
      let cleanProd = matchedOrder.product
        .replace(/, color negro/i, '')
        .replace(/ de 220 Cápsulas de 1000 mg/i, '')
        .replace(/ En Polvo Sin Sabor 450g/i, '')
        .replace(/ - Paquete de viaje expandible 26\+6/i, '')
        .replace(/ - Azul y Gris/i, '')
        .replace(/ \(2 TX \+ 1 RX \+ Estuche de Carga\)/i, '')
        .replace(/ - 15 Tapones/i, '')
        .replace(/ 20V 3A, Cargador USB/i, '')
        .replace(/ Cargador USB/i, '')
        .replace(/, Portable SSD, up-to 1050MB\/s.*/i, ' 4TB')
        .replace(/ \(256GB\)/i, ' 256GB')
        .replace(/ para Laptop de 25,000 mAh con 3 Puertos USB-C.*/i, ' 25,000 mAh')
        .replace(/, 28 Equipaje de Gran Capacidad/i, '')
        .trim();

      proposedName = `Amazon - ${cleanProd}`;
      if (currentName !== proposedName) {
        action = 'UPDATE_RECOMMENDED';
        notes = `Coincide con orden de captura (#${matchedOrder.orderNumber}) del ${matchedOrder.date}`;
      } else {
        action = 'ALREADY_EXPLICIT';
        notes = `Ya tiene nombre explícito coincidente con orden`;
      }
    } else {
      if (isGeneric) {
        if (amount === 99) {
          proposedName = 'Amazon - Membresía Prime Mensual';
          action = 'UPDATE_RECOMMENDED';
          notes = 'Cargo recurrente de membresía Amazon Prime';
        } else if (amount === 179.54) {
          proposedName = 'Amazon - Compra (Sin captura de producto identificada)';
          action = 'MANUAL_REVIEW';
          notes = 'Monto no encontrado en capturas de pantalla de Amazon';
        } else {
          action = 'MANUAL_REVIEW';
          notes = 'Monto genérico sin orden en capturas';
        }
      } else {
        action = 'ALREADY_EXPLICIT';
        notes = 'Nombre ya descriptivo en BD';
      }
    }

    results.push({
      _id: tx._id.toString(),
      date: dateStr,
      amount: amount,
      currentName: currentName,
      proposedName: proposedName,
      action: action,
      notes: notes
    });
  }

  fs.writeFileSync('/tmp/amazon_mapping_table.json', JSON.stringify(results, null, 2), 'utf8');
  console.log('Saved mapping table to /tmp/amazon_mapping_table.json');

  // Let's print summary table
  console.log('\n============================= PROPUESTA DE MAPEO DE AMAZON =============================');
  console.log('ID                       | Fecha      | Monto      | Nombre Actual          -> Nombre Propuesto');
  console.log('-'.repeat(100));
  for (let r of results) {
    if (r.action === 'UPDATE_RECOMMENDED' || r.action === 'MANUAL_REVIEW') {
      console.log(`${r._id} | ${r.date} | $${r.amount.toFixed(2).padStart(8)} | ${r.currentName.padEnd(22)} -> ${r.proposedName}`);
    }
  }
  console.log('-'.repeat(100));
  const toUpdate = results.filter(r => r.action === 'UPDATE_RECOMMENDED').length;
  console.log(`Total para actualizar propuestos: ${toUpdate} de ${results.length}`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
