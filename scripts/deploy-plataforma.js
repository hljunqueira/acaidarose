const { execSync } = require('child_process');

console.log('🏁 ====================================================');
console.log('🏁 INICIANDO DEPLOY COMPLETO DA PLATAFORMA AÇAÍ DA ROSE (VPS)');
console.log('🏁 ====================================================\n');

try {
  // 1. Deploy do Next.js Standalone na VPS (app.acaidarose.pt)
  console.log('👉 [Etapa 1 de 2] Iniciando implantação do Next.js Standalone (VPS)...');
  execSync('node scripts/deploy-app.js', { stdio: 'inherit' });
  console.log('────────────────────────────────────────────────────────\n');

  // 2. Deploy do Site Legado na VPS (acaidarose.pt)
  console.log('👉 [Etapa 2 de 2] Iniciando implantação do Site Legado (VPS)...');
  execSync('node scripts/deploy-sitelegado.js', { stdio: 'inherit' });
  console.log('────────────────────────────────────────────────────────\n');

  console.log('🏆 ====================================================');
  console.log('🏆 DEPLOY DA PLATAFORMA CONCLUÍDO COM SUCESSO NA VPS!');
  console.log('🏆 Plataforma: https://app.acaidarose.pt');
  console.log('🏆 Site Institucional: https://acaidarose.pt');
  console.log('🏆 ====================================================');
} catch (err) {
  console.error('\n❌ Erro crítico: O deploy falhou em uma das etapas!', err.message || err);
  process.exit(1);
}
