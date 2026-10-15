import { syncAllStoresCatalog } from '../lib/repositories/productsRepository'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })


async function main() {
  console.log('🔄 Iniciando replicação completa do cardápio oficial da Matriz para toda a rede...');
  const result = await syncAllStoresCatalog({
    applyToAll: true,
    tenantId: '11111111-1111-1111-1111-111111111111',
    userEmail: 'admin@acaidarose.pt'
  });
  console.log('✅ Resultado da sincronização:', result);
}

main().catch(err => {
  console.error('❌ Erro na sincronização:', err);
  process.exit(1);
});
