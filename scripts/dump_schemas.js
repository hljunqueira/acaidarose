const fs = require('fs');
const readline = require('readline');

const structure = JSON.parse(fs.readFileSync('scripts/oimenu_structure.json', 'utf8'));

console.log('==============================================');
console.log('DETALHAMENTO DE TABELAS - OIMENU / ABRAHÃO');
console.log('==============================================\n');

for (const [tbl, schema] of Object.entries(structure.schemas)) {
  console.log(`\n================== TABELA: ${tbl} ==================`);
  console.log(schema.trim());
}
