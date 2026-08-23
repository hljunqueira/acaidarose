const fs = require('fs');
const readline = require('readline');

const fileStream = fs.createReadStream('C:\\Users\\Henrique - PC\\Downloads\\oimenu_bkp.sql');
const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

let capture = false;
let currentBlock = '';
const blocks = [];

rl.on('line', (line) => {
  if (line.match(/CREATE TABLE [`"]?app_configuration[`"]?/i) || line.match(/CREATE TABLE [`"]?configuration[`"]?/i)) {
    capture = true;
    currentBlock = line + '\n';
  } else if (capture) {
    currentBlock += line + '\n';
    if (line.includes(';')) {
      blocks.push(currentBlock);
      capture = false;
      currentBlock = '';
    }
  }

  if (line.match(/INSERT INTO [`"]?app_configuration[`"]?/i) || line.match(/INSERT INTO [`"]?configuration[`"]?/i)) {
    blocks.push(line);
  }
});

rl.on('close', () => {
  blocks.forEach(b => console.log(b + '\n---'));
});
