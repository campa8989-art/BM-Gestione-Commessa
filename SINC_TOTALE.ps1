# SINC_TOTALE.ps1 - Sincronizzazione Completa (Dati + Web)
# Esegui questo script per un aggiornamento totale di scadenze, conformità e file.

$ErrorActionPreference = "Continue"
$ScriptsDir = Join-Path $PSScriptRoot "01-Operation\02_Scripts_System"

Write-Host "----------------------------------------------------" -ForegroundColor Cyan
Write-Host "    💎 SINC_TOTALE: AGGIORNAMENTO SISTEMA COMPLETO  " -ForegroundColor Cyan
Write-Host "----------------------------------------------------" -ForegroundColor Cyan

# 1. Esegue la Sincronizzazione Online (File + Git)
Write-Host "[1/3] Sincronizzazione file e preparazione web..." -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -File .\SINC_ONLINE.ps1

# 2. Aggiorna i dati della Dashboard dai file CSV Excel
if (Test-Path (Join-Path $ScriptsDir "sync_data.ps1")) {
    Write-Host "[2/3] Generazione dati della Dashboard dai file CSV..." -ForegroundColor Yellow
    Push-Location $ScriptsDir
    powershell -ExecutionPolicy Bypass -File .\sync_data.ps1
    Pop-Location
} else {
    Write-Warning "AVVISO: Script sync_data.ps1 non trovato in $ScriptsDir"
}

# 3. Invia nuovamente a GitHub per includere le nuove statistiche
Write-Host "[3/3] Sincronizzazione finale dati calcolati su GitHub..." -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -File .\aggiorna_dashboard_online.ps1

Write-Host ""
Write-Host "----------------------------------------------------" -ForegroundColor Green
Write-Host "         TUTTO AGGIORNATO CON SUCCESSO!            " -ForegroundColor Green
Write-Host "----------------------------------------------------" -ForegroundColor Green
Write-Host "Il sito sara' visibile online tra 60 secondi."
Write-Host ""
