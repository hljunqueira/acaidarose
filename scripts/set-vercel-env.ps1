# Script PowerShell para Sincronização de Variáveis na Vercel
# Uso: .\scripts\set-vercel-env.ps1

$envVars = @{
    "DATABASE_URL"        = "postgresql://acai_admin:da9d329d3252f5b61a2d810b4b765ce9@198.50.117.110:5432/acaidarose_prod"
    "DIRECT_URL"          = "postgresql://acai_admin:da9d329d3252f5b61a2d810b4b765ce9@198.50.117.110:5432/acaidarose_prod"
    "JWT_SECRET"          = "ca90799f2d1e2e604f32c3f8fba3bceb3b27be30058ec0ffad8a23053bbef50a"
    "AUTH_SECRET"         = "ca90799f2d1e2e604f32c3f8fba3bceb3b27be30058ec0ffad8a23053bbef50a"
    "NEXT_PUBLIC_APP_URL" = "https://acaidarose.vercel.app"
    "NEXT_PUBLIC_API_URL" = "https://acaidarose.vercel.app/api"
    "NEXT_PUBLIC_APP_ENV" = "production"
}

$environments = @("production", "preview", "development")

Write-Host "🚀 Iniciando sincronização de variáveis com a Vercel..." -ForegroundColor Cyan

foreach ($item in $envVars.GetEnumerator()) {
    $key = $item.Key
    $value = $item.Value

    foreach ($env in $environments) {
        Write-Host "⏳ Configurando $key ($env)..." -ForegroundColor Yellow

        # Remove se existir
        npx vercel env rm $key $env --yes 2>$null

        # Adiciona
        $value | npx vercel env add $key $env --force

        Write-Host "✅ $key configurado em [$env]" -ForegroundColor Green
    }
}

Write-Host "`n🎉 Todas as variáveis foram enviadas para a Vercel!" -ForegroundColor Green
