const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

if (!fs.existsSync('public/downloads')) {
  fs.mkdirSync('public/downloads', { recursive: true });
}

fs.copyFileSync('tools/print-agent/instalar-inicializacao.bat', 'dist/print-agent/instalar-inicializacao.bat');
fs.copyFileSync('tools/print-agent/LEIA-ME.txt', 'dist/print-agent/LEIA-ME.txt');
fs.copyFileSync('dist/print-agent/acaidarose-print-agent.exe', 'public/downloads/acaidarose-print-agent.exe');

const zipPath = path.resolve('public/downloads/acaidarose-servidor-impressao.zip');
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

const distPath = path.resolve('dist/print-agent/*');
execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${distPath}' -DestinationPath '${zipPath}' -Force"`);

const stats = fs.statSync(zipPath);
console.log(`Package created: ${zipPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

