const fs = require('fs');
const readline = require('readline');

const sqlPath = 'C:\\Users\\Henrique - PC\\Downloads\\oimenu_bkp.sql';

const fileStream = fs.createReadStream(sqlPath);
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

const samples = {};
const counts = {};

rl.on('line', (line) => {
  const insertMatch = line.match(/^INSERT INTO [`"]?([a-zA-Z0-9_]+)[`"]?/i);
  if (insertMatch) {
    const tbl = insertMatch[1];
    counts[tbl] = (counts[tbl] || 0) + 1;
    if (!samples[tbl]) samples[tbl] = [];
    if (samples[tbl].length < 3) {
      samples[tbl].push(line);
    }
  }
});

rl.on('close', () => {
  const structure = JSON.parse(fs.readFileSync('scripts/oimenu_structure.json', 'utf8'));

  const report = {
    totalTables: Object.keys(structure.schemas).length,
    tableCounts: counts,
    schemas: structure.schemas,
    samples: samples
  };

  fs.writeFileSync('scripts/oimenu_deep_report.json', JSON.stringify(report, null, 2));
  console.log('Deep report gerado com sucesso em scripts/oimenu_deep_report.json');
});
