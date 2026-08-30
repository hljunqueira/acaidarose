const { execSync } = require('child_process');

console.log('🚀 Iniciando deploy do backend Next.js para a Vercel...');

try {
  // 1. Sincronizar as variáveis de ambiente .env.local com a Vercel
  console.log('⏳ Sincronizando variáveis de ambiente...');
  execSync('node scripts/set-vercel-env.js', { stdio: 'inherit' });

  // 2. Executar o deploy de produção do Vercel CLI
  console.log('📤 Enviando e compilando projeto na Vercel...');
  execSync('npx vercel --prod --yes', { stdio: 'inherit' });
  
  console.log('🎉 Deploy do backend concluído com sucesso!');
} catch (err) {
  console.error('❌ Erro durante o deploy do backend:', err.message || err);
  process.exit(1);
}
