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

const tables = new Set();
const createTableStatements = {};
let currentTable = null;
let currentCreate = '';
let lineCount = 0;
const sampleInserts = {};

rl.on('line', (line) => {
  lineCount++;
  
  const createMatch = line.match(/CREATE TABLE [`"]?([a-zA-Z0-9_]+)[`"]?/i);
  if (createMatch) {
    currentTable = createMatch[1];
    tables.add(currentTable);
    currentCreate = line + '\n';
  } else if (currentTable) {
    currentCreate += line + '\n';
    if (line.includes(';')) {
      createTableStatements[currentTable] = currentCreate;
      currentTable = null;
      currentCreate = '';
    }
  }

  const insertMatch = line.match(/INSERT INTO [`"]?([a-zA-Z0-9_]+)[`"]?/i);
  if (insertMatch) {
    const tbl = insertMatch[1];
    tables.add(tbl);
    if (!sampleInserts[tbl]) {
      sampleInserts[tbl] = line.slice(0, 300);
    }
  }
});

rl.on('close', () => {
  console.log('--- ANÁLISE DO BANCO OIMENU ---');
  console.log('Total de Linhas no Dump:', lineCount);
  console.log('Total de Tabelas:', tables.size);
  console.log('\nTabelas Encontradas:');
  Array.from(tables).sort().forEach(t => console.log(' - ' + t));

  console.log('\n--- ESTRUTURA DAS TABELAS (SCHEMAS) ---');
  for (const [tbl, schema] of Object.entries(createTableStatements)) {
    console.log(`\n=== TABELA: ${tbl} ===`);
    console.log(schema.trim());
  }

  console.log('\n--- AMOSTRA DE INSERTS ---');
  for (const [tbl, ins] of Object.entries(sampleInserts)) {
    console.log(`[${tbl}]: ${ins}...`);
  }
});
