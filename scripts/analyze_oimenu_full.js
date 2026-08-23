const fs = require('fs');
const readline = require('readline');
const path = require('path');

const sqlPath = 'C:\\Users\\Henrique - PC\\Downloads\\oimenu_bkp.sql';

if (!fs.existsSync(sqlPath)) {
  console.error('Arquivo não encontrado:', sqlPath);
  process.exit(1);
}

const fileStream = fs.createReadStream(sqlPath);
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

let inCreate = false;
let currentTable = '';
let currentSql = '';
const tableSchemas = {};
const tableColumns = {};

rl.on('line', (line) => {
  const matchCreate = line.match(/CREATE TABLE [`"]?([a-zA-Z0-9_]+)[`"]?/i);
  if (matchCreate) {
    inCreate = true;
    currentTable = matchCreate[1];
    currentSql = line + '\n';
  } else if (inCreate) {
    currentSql += line + '\n';
    if (line.includes(';')) {
      tableSchemas[currentTable] = currentSql;
      
      // parse columns
      const lines = currentSql.split('\n');
      const cols = [];
      for (const l of lines) {
        const colMatch = l.trim().match(/^[`"]([a-zA-Z0-9_]+)[`"]\s+([^,]+)/);
        if (colMatch) {
          cols.push({ name: colMatch[1], type: colMatch[2] });
        }
      }
      tableColumns[currentTable] = cols;
      
      inCreate = false;
      currentTable = '';
      currentSql = '';
    }
  }
});

rl.on('close', () => {
  console.log('=== TOTAL DE TABELAS ENCONTRADAS ===', Object.keys(tableSchemas).length);
  const tableNames = Object.keys(tableSchemas).sort();
  console.log(JSON.stringify(tableNames, null, 2));

  // Search keywords: qr, store, multi, filial, branch, table, order, call, config, franchise, brand, menu, tablet
  const qrcodeTables = [];
  const multilojaTables = [];

  tableNames.forEach(tbl => {
    const s = tableSchemas[tbl].toLowerCase();
    const isMulti = s.includes('store') || s.includes('loja') || s.includes('branch') || s.includes('franchis') || tbl.includes('store') || tbl.includes('company');
    const isQr = s.includes('qr') || s.includes('table') || s.includes('mesa') || s.includes('comanda') || s.includes('call') || s.includes('tablet') || s.includes('waiter') || s.includes('menu');
    
    if (isMulti) multilojaTables.push(tbl);
    if (isQr) qrcodeTables.push(tbl);
  });

  console.log('\n--- TABELAS COM RELAÇÃO A MULTILOJA / STORE ---');
  console.log(JSON.stringify(multilojaTables, null, 2));

  console.log('\n--- TABELAS COM RELAÇÃO A QR CODE / MESAS / ATENDIMENTO / CARDÁPIO ---');
  console.log(JSON.stringify(qrcodeTables, null, 2));

  // Write full summary json
  fs.writeFileSync('scripts/oimenu_structure.json', JSON.stringify({
    tables: tableNames,
    schemas: tableSchemas,
    columns: tableColumns
  }, null, 2));
  console.log('\nEstrutura salva em scripts/oimenu_structure.json com sucesso!');
});
