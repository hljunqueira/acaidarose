const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const VPS_HOST = '198.50.117.110';
const VPS_USER = 'root';
const VPS_DEST = '/etc/icontainer/apps/nginx/nginx/www/sites/acaidarose.pt/index';
const LOCAL_TAR = 'legacy-static.tar.gz';
const REMOTE_TAR = `/tmp/${LOCAL_TAR}`;

console.log('🚀 Iniciando deploy do site legado para a VPS...');

try {
  // 1. Compactar localmente a pasta legacy-static excluindo arquivos .php e outros desnecessários
  console.log('📦 Compactando arquivos em legacy-static...');
  execSync(`tar --exclude="*.php" --exclude="*.bk" --exclude="*.zip" --exclude="license.txt" --exclude="llms.txt" -czf ${LOCAL_TAR} -C legacy-static .`, { stdio: 'inherit' });
  console.log('✅ Arquivo compactado com sucesso.');

  // 2. Transferir para a VPS via SCP
  console.log(`📤 Enviando ${LOCAL_TAR} para a VPS (${VPS_HOST})...`);
  execSync(`scp -o StrictHostKeyChecking=no ${LOCAL_TAR} ${VPS_USER}@${VPS_HOST}:${REMOTE_TAR}`, { stdio: 'inherit' });
  console.log('✅ Transferência concluída.');

  // 3. Conectar via SSH para extrair e reload Nginx
  console.log('⚙️ Executando extração e reinicialização do servidor Nginx na VPS...');
  const sshCmd = `
    mkdir -p ${VPS_DEST} &&
    rm -rf ${VPS_DEST}/* &&
    tar -xzf ${REMOTE_TAR} -C ${VPS_DEST}/ &&
    rm -f ${REMOTE_TAR} &&
    docker exec ic-nginx-PHXo nginx -s reload
  `.trim().replace(/\s+/g, ' ');

  execSync(`ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "${sshCmd}"`, { stdio: 'inherit' });
  console.log('✅ Extração e reload do Nginx executados com sucesso!');

} catch (err) {
  console.error('❌ Erro durante o deploy do site legado:', err.message || err);
  process.exit(1);
} finally {
  // 4. Limpar arquivo local
  if (fs.existsSync(LOCAL_TAR)) {
    console.log('🧹 Limpando arquivo compactado local...');
    try {
      fs.unlinkSync(LOCAL_TAR);
      console.log('✅ Arquivo local removido.');
    } catch (cleanupErr) {
      console.error('⚠️ Falha ao remover arquivo compactado local:', cleanupErr.message || cleanupErr);
    }
  }
}

console.log('🎉 Deploy do site legado concluído com sucesso!');
