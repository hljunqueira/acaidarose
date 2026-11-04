const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const VPS_HOST = '198.50.117.110';
const VPS_USER = 'root';
const VPS_APP_DIR = '/root/acaidarose/app';
const LOCAL_TAR = 'app-standalone.tar.gz';
const REMOTE_TAR = `/tmp/${LOCAL_TAR}`;

console.log('🚀 ========================================================');
console.log('🚀 INICIANDO DEPLOY DO NEXT.JS STANDALONE PARA A VPS');
console.log('🚀 Domínio Oficial: https://app.acaidarose.pt');
console.log('🚀 ========================================================\n');

try {
  // 1. Compilar o Next.js localmente em modo standalone
  console.log('📦 [1/5] Compilando Next.js (npm run build)...');
  execSync('npm run build', { stdio: 'inherit' });

  // 2. Copiar assets estáticos para a pasta standalone
  console.log('\n📂 [2/5] Organizando arquivos estáticos no standalone...');
  const standaloneDir = path.join(__dirname, '..', '.next', 'standalone');
  const staticSrc = path.join(__dirname, '..', '.next', 'static');
  const staticDest = path.join(standaloneDir, '.next', 'static');
  const publicSrc = path.join(__dirname, '..', 'public');
  const publicDest = path.join(standaloneDir, 'public');

  if (!fs.existsSync(standaloneDir)) {
    throw new Error('Pasta .next/standalone não encontrada após o build.');
  }

  // Copia recursiva de .next/static para .next/standalone/.next/static
  fs.mkdirSync(path.dirname(staticDest), { recursive: true });
  fs.cpSync(staticSrc, staticDest, { recursive: true, force: true });
  console.log('   ✓ .next/static copiado para standalone');

  // Copia recursiva de public para .next/standalone/public
  if (fs.existsSync(publicSrc)) {
    fs.cpSync(publicSrc, publicDest, { recursive: true, force: true });
    console.log('   ✓ public/ copiado para standalone');
  }

  // Copia da pasta certificates para o standalone
  const certsSrc = path.join(__dirname, '..', 'certificates');
  const certsDest = path.join(standaloneDir, 'certificates');
  if (fs.existsSync(certsSrc)) {
    fs.cpSync(certsSrc, certsDest, { recursive: true, force: true });
    console.log('   ✓ certificates/ copiado para standalone');
  }

  // Copiar .env.production.local como .env no standalone
  const envSrc = path.join(__dirname, '..', '.env.production.local');
  if (fs.existsSync(envSrc)) {
    fs.copyFileSync(envSrc, path.join(standaloneDir, '.env'));
    fs.copyFileSync(envSrc, path.join(standaloneDir, '.env.production'));
    console.log('   ✓ Variáveis de ambiente de produção adicionadas ao bundle');
  }

  // 3. Compactar standalone
  console.log('\n📦 [3/5] Compactando bundle para transferência...');
  if (fs.existsSync(LOCAL_TAR)) {
    fs.unlinkSync(LOCAL_TAR);
  }
  execSync(`tar -czf ${LOCAL_TAR} -C "${standaloneDir}" .`, { stdio: 'inherit' });
  const stats = fs.statSync(LOCAL_TAR);
  console.log(`   ✓ Bundle compactado: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  // 4. Transferir para a VPS via SCP
  console.log(`\n📤 [4/5] Enviando para a VPS (${VPS_HOST})...`);
  execSync(`scp -o StrictHostKeyChecking=no ${LOCAL_TAR} ${VPS_USER}@${VPS_HOST}:${REMOTE_TAR}`, { stdio: 'inherit' });
  console.log('   ✓ Transferência concluída com sucesso.');

  // 5. Extrair e reiniciar container Docker na VPS
  console.log('\n⚙️ [5/5] Extraindo e reiniciando container acaidarose-app na VPS...');
  const sshCmd = [
    `mkdir -p ${VPS_APP_DIR}`,
    `rm -rf ${VPS_APP_DIR}/*`,
    `tar -xzf ${REMOTE_TAR} -C ${VPS_APP_DIR}/`,
    `rm -f ${REMOTE_TAR}`,
    `docker stop acaidarose-app 2>/dev/null || true`,
    `docker rm acaidarose-app 2>/dev/null || true`,
    `docker run -d --name acaidarose-app --restart always --network host --env-file ${VPS_APP_DIR}/.env -e PORT=3000 -e HOSTNAME=0.0.0.0 -e NODE_ENV=production -v ${VPS_APP_DIR}:/app -w /app node:20-alpine node server.js`,
    `docker exec ic-nginx-PHXo nginx -s reload 2>/dev/null || true`
  ].join(' && ');

  execSync(`ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "${sshCmd}"`, { stdio: 'inherit' });

  console.log('\n🔍 Verificando integridade do container...');
  const checkStatus = execSync(`ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "docker ps --filter name=acaidarose-app --format 'Status: {{.Status}} | Image: {{.Image}}'"`, { encoding: 'utf-8' });
  console.log(`   ✓ Container: ${checkStatus.trim()}`);

  console.log('\n🎉 ========================================================');
  console.log('🎉 DEPLOY CONCLUÍDO COM SUCESSO NA VPS!');
  console.log('🎉 Aplicação disponível em: https://app.acaidarose.pt');
  console.log('🎉 ========================================================');
} catch (err) {
  console.error('\n❌ Erro durante o deploy do Next.js:', err.message || err);
  process.exit(1);
} finally {
  if (fs.existsSync(LOCAL_TAR)) {
    try {
      fs.unlinkSync(LOCAL_TAR);
    } catch {}
  }
}

