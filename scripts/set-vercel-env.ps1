# Script PowerShell para Sincronização Segura de Variáveis na Vercel
# Lê dinamicamente do .env.local

$envFile = Join-Path $PSScriptRoot "..\.env.local"

if (-not (Test-Path $envFile)) {
    Write-Host "❌ Arquivo .env.local não encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Sincronizando variáveis do .env.local com a Vercel..." -ForegroundColor Cyan

Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
        $parts = $line.Split("=", 2)
        $key = $parts[0].Trim()
        $value = $parts[1].Trim().Trim('"').Trim("'")

        if ($key -and $value) {
            Write-Host "⏳ Configurando $key em Production..." -ForegroundColor Yellow
            npx vercel env rm $key production --yes 2>$null
            $value | npx vercel env add $key production --force
            Write-Host "✅ $key configurado!" -ForegroundColor Green
        }
    }
}

Write-Host "`n🎉 Todas as variáveis foram sincronizadas na Vercel com sucesso!" -ForegroundColor Green
