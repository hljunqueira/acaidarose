/**
 * Script de Automação de Variáveis de Ambiente na Vercel
 * Lê dinamicamente do arquivo local .env.local e sincroniza com a Vercel
 * Executa: npm run env:sync
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 Iniciando sincronização segura de variáveis com a Vercel...\n')

// 1. Carrega o arquivo .env.local
const envLocalPath = path.join(process.cwd(), '.env.local')

if (!fs.existsSync(envLocalPath)) {
  console.error('❌ Arquivo .env.local não encontrado!')
  console.error('Crie o arquivo .env.local com base no .env.example antes de sincronizar.')
  process.exit(1)
}

const envContent = fs.readFileSync(envLocalPath, 'utf8')
const envVars = {}

envContent.split('\n').forEach((line) => {
  const trimmed = line.trim()
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const idx = trimmed.indexOf('=')
    const key = trimmed.slice(0, idx).trim()
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
    if (key && val) {
      envVars[key] = val
    }
  }
})

// 2. Sincroniza cada variável em Production
for (const [key, value] of Object.entries(envVars)) {
  try {
    console.log(`⏳ Gravando ${key} em Production...`)

    try {
      execSync(`npx vercel env rm ${key} production --yes`, { stdio: 'ignore' })
    } catch {}

    execSync(`npx vercel env add ${key} production --force`, {
      input: Buffer.from(value),
      stdio: ['pipe', 'inherit', 'inherit'],
    })

    console.log(`✅ ${key} sincronizado com sucesso!\n`)
  } catch (err) {
    console.error(`⚠️ Erro ao adicionar ${key}:`, err.message || err)
  }
}

console.log('🎉 Todas as variáveis do .env.local foram sincronizadas na Vercel!')
