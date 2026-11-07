const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

if (!fs.existsSync('public/downloads')) {
  fs.mkdirSync('public/downloads', { recursive: true });
}

// Garante pasta logs e config.json padrão
const distDir = path.resolve('dist/print-agent');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const logsDir = path.join(distDir, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}
fs.writeFileSync(path.join(logsDir, 'historico.txt'), 'Pasta destinada aos logs de impressão diários do Agente Windows.\n');

const defaultConfig = {
  Port: 4040,
  PollIntervalMs: 2000,
  ApiUrl: 'https://app.acaidarose.pt',
  StoreToken: ''
};
fs.writeFileSync(path.join(distDir, 'config.json'), JSON.stringify(defaultConfig, null, 2));

fs.copyFileSync('tools/print-agent/instalar-inicializacao.bat', path.join(distDir, 'instalar-inicializacao.bat'));
fs.copyFileSync('tools/print-agent/LEIA-ME.txt', path.join(distDir, 'LEIA-ME.txt'));

if (fs.existsSync(path.join(distDir, 'acaidarose-print-agent.exe'))) {
  fs.copyFileSync(path.join(distDir, 'acaidarose-print-agent.exe'), 'public/downloads/acaidarose-print-agent.exe');
}

const zipPath = path.resolve('public/downloads/acaidarose-servidor-impressao.zip');
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

// Compacta mantendo a estrutura completa (executável, config.json, pasta logs, script de inicialização)
const distPath = path.resolve('dist/print-agent/*');
execSync(`powershell -NoProfile -Command "$ProgressPreference = 'SilentlyContinue'; Compress-Archive -Path '${distPath}' -DestinationPath '${zipPath}' -Force"`);

const stats = fs.statSync(zipPath);
console.log(`Package created: ${zipPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
