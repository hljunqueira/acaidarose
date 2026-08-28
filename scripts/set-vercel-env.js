/**
 * Script de Automação de Variáveis de Ambiente na Vercel
 * Executa: node scripts/set-vercel-env.js [token-opcional]
 */

const { execSync } = require('child_process')

const envVars = {
  DATABASE_URL: 'postgresql://acai_admin:da9d329d3252f5b61a2d810b4b765ce9@198.50.117.110:5432/acaidarose_prod',
  DIRECT_URL: 'postgresql://acai_admin:da9d329d3252f5b61a2d810b4b765ce9@198.50.117.110:5432/acaidarose_prod',
  JWT_SECRET: 'ca90799f2d1e2e604f32c3f8fba3bceb3b27be30058ec0ffad8a23053bbef50a',
  AUTH_SECRET: 'ca90799f2d1e2e604f32c3f8fba3bceb3b27be30058ec0ffad8a23053bbef50a',
  NEXT_PUBLIC_APP_URL: 'https://acaidarose.vercel.app',
  NEXT_PUBLIC_API_URL: 'https://acaidarose.vercel.app/api',
  NEXT_PUBLIC_APP_ENV: 'production',
}

const environments = ['production', 'preview', 'development']

console.log('🚀 Iniciando sincronização de variáveis com a Vercel (CLI 59.9.1)...\n')

// Testa se está autenticado
try {
  execSync('npx vercel whoami', { stdio: 'pipe' })
} catch (e) {
  console.error('\n⚠️ VOCÊ PRECISA DE FAZER LOGIN NA VERCEL PRIMEIRO:')
  console.error('👉 Execute no terminal: npx vercel login')
  console.error('Depois de autenticar no navegador, execute novamente: npm run env:sync\n')
  process.exit(1)
}

const tokenArg = process.argv[2] ? `--token ${process.argv[2]}` : ''

for (const [key, value] of Object.entries(envVars)) {
  for (const env of environments) {
    try {
      console.log(`⏳ Configurando ${key} em [${env}]...`)
      
      try {
        execSync(`npx vercel env rm ${key} ${env} --yes ${tokenArg}`, {
          stdio: 'ignore',
        })
      } catch {
        // Ignora se não existir
      }

      execSync(`echo "${value}" | npx vercel env add ${key} ${env} --force ${tokenArg}`, {
        stdio: 'pipe',
        shell: true,
      })

      console.log(`✅ ${key} configurado com sucesso em [${env}]`)
    } catch (err) {
      console.error(`⚠️ Erro ao adicionar ${key} em [${env}]:`, err.message || err)
    }
  }
}

console.log('\n🎉 Todas as variáveis de ambiente foram sincronizadas na Vercel!')
