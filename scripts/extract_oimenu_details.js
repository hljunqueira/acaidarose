const fs = require('fs');
const readline = require('readline');

const fileStream = fs.createReadStream('C:\\Users\\Henrique - PC\\Downloads\\oimenu_bkp.sql');
const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

const targetTables = [
  'configuration',
  'app_configuration',
  'call_waiter_option',
  'square',
  'store_table',
  'printer',
  'payment_flags',
  'store',
  'store_update',
  'tablet'
];

const found = {};

rl.on('line', (line) => {
  for (const t of targetTables) {
    const regex = new RegExp('INSERT INTO [`"]?' + t + '[`"]?', 'i');
    if (regex.test(line)) {
      if (!found[t]) found[t] = [];
      found[t].push(line);
    }
  }
});

rl.on('close', () => {
  for (const [tbl, list] of Object.entries(found)) {
    console.log('==============================');
    console.log('TABELA:', tbl, `(${list.length} inserts)`);
    console.log('==============================');
    list.forEach((l, idx) => {
      console.log(`[Registro ${idx + 1}]:\n`, l.length > 800 ? l.slice(0, 800) + '... (truncado)' : l);
    });
    console.log('\n');
  }
});
