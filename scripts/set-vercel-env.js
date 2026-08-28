/**
 * Script de Automação de Variáveis de Ambiente na Vercel
 * Executa: node scripts/set-vercel-env.js [token-opcional]
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

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

console.log('🚀 Iniciando sincronização de variáveis com a Vercel...\n')

const tokenArg = process.argv[2] ? `--token ${process.argv[2]}` : ''

for (const [key, value] of Object.entries(envVars)) {
  for (const env of environments) {
    try {
      console.log(`⏳ Configurando ${key} (${env})...`)
      
      // Remove se já existir para evitar conflito
      try {
        execSync(`npx vercel env rm ${key} ${env} --yes ${tokenArg}`, {
          stdio: 'ignore',
        })
      } catch {
        // Ignora se não existir
      }

      // Adiciona a variável via stdin
      execSync(`echo "${value}" | npx vercel env add ${key} ${env} --force ${tokenArg}`, {
        stdio: 'pipe',
        shell: true,
      })

      console.log(`✅ ${key} adicionado em [${env}]`)
    } catch (err) {
      console.error(`⚠️ Aviso ao adicionar ${key} em [${env}]:`, err.message || err)
    }
  }
}

console.log('\n🎉 Sincronização concluída com sucesso!')
