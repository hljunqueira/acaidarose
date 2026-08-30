const { execSync } = require('child_process');

console.log('🏁 ====================================================');
console.log('🏁 INICIANDO DEPLOY COMPLETO DA PLATAFORMA AÇAÍ DA ROSE');
console.log('🏁 ====================================================\n');

try {
  // 1. Deploy do Backend na Vercel
  console.log('👉 [Etapa 1 de 2] Iniciando implantação do Next.js (Vercel)...');
  execSync('node scripts/deploy-back.js', { stdio: 'inherit' });
  console.log('────────────────────────────────────────────────────────\n');

  // 2. Deploy do Site Legado na VPS
  console.log('👉 [Etapa 2 de 2] Iniciando implantação do Site Legado (VPS)...');
  execSync('node scripts/deploy-sitelegado.js', { stdio: 'inherit' });
  console.log('────────────────────────────────────────────────────────\n');

  console.log('🏆 ====================================================');
  console.log('🏆 DEPLOY DA PLATAFORMA CONCLUÍDO COM SUCESSO!');
  console.log('🏆 ====================================================');
} catch (err) {
  console.error('\n❌ Erro crítico: O deploy falhou em uma das etapas!', err.message || err);
  process.exit(1);
}
