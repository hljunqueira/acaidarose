const fs = require('fs');
const path = require('path');

const certPath = path.join(__dirname, '..', 'certificates', 'acaidarose-qz-cert.crt');
const keyPath = path.join(__dirname, '..', 'certificates', 'qz-private-key.pem');

if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
  console.error('Certificado ou chave não encontrados!');
  process.exit(1);
}

const cert = fs.readFileSync(certPath, 'utf8').trim();
const key = fs.readFileSync(keyPath, 'utf8').trim();

const escapedCert = cert.replace(/\r?\n/g, '\\n');
const escapedKey = key.replace(/\r?\n/g, '\\n');

const envFiles = [
  path.join(__dirname, '..', '.env.local'),
  path.join(__dirname, '..', '.env.production.local'),
  path.join(__dirname, '..', '.env'),
];

for (const envPath of envFiles) {
  if (!fs.existsSync(envPath)) continue;

  let envContent = fs.readFileSync(envPath, 'utf8');

  // Remove entradas antigas
  envContent = envContent
    .split('\n')
    .filter(line => !line.startsWith('QZ_CERTIFICATE=') && !line.startsWith('QZ_PRIVATE_KEY='))
    .join('\n')
    .trim();

  envContent += `\n\n# Certificado Digital Oficial QZ Tray (Impressão Silenciosa Sem Popups)\nQZ_CERTIFICATE="${escapedCert}"\nQZ_PRIVATE_KEY="${escapedKey}"\n`;

  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log(`✅ QZ_CERTIFICATE e QZ_PRIVATE_KEY sincronizados com sucesso em ${path.basename(envPath)}!`);
}
