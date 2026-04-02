# SINC_TOTALE.ps1 - Sincronizzazione Completa (Locale + GitHub)
# Esegui questo script per aggiornare TUTTO con un solo click.

$ErrorActionPreference = "Continue"
$ScriptsDir = Join-Path $PSScriptRoot "01-Operation\02_Scripts_System"

Write-Host "----------------------------------------------------" -ForegroundColor Cyan
Write-Host "    AVVIO SINCRONIZZAZIONE TOTALE (PULIZIA INC)...  " -ForegroundColor Cyan
Write-Host "----------------------------------------------------" -ForegroundColor Cyan

# 0. FASE PRELIMINARE: PULIZIA TEMP
Write-Host "[0/3] Pulizia file temporanei..." -ForegroundColor Yellow

# Pulisce cartelle tmp
Remove-Item -Path ".\01-Operation\tmp\*" -Recurse -Force -ErrorAction SilentlyContinue

# 1. Aggiorna l'elenco dei file (Workspace)
Write-Host "[1/3] Scansione dei file OneDrive (Workspace)..." -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -File .\aggiorna_dati_archivio.ps1

# 2. Aggiorna i dati della Dashboard dai file CSV Excel
if (Test-Path (Join-Path $ScriptsDir "sync_data.ps1")) {
    Write-Host "[2/3] Generazione dati della Dashboard dai file CSV..." -ForegroundColor Yellow
    Push-Location $ScriptsDir
    powershell -ExecutionPolicy Bypass -File .\sync_data.ps1
    Pop-Location
} else {
    Write-Warning "AVVISO: Script sync_data.ps1 non trovato in $ScriptsDir"
}

# 3. Invia tutto a GitHub (Inclusa l'anteprima online)
Write-Host "[3/3] Invio a GitHub in corso..." -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -File .\aggiorna_dashboard_online.ps1

Write-Host ""
Write-Host "----------------------------------------------------" -ForegroundColor Green
Write-Host "         TUTTO AGGIORNATO CON SUCCESSO!            " -ForegroundColor Green
Write-Host "----------------------------------------------------" -ForegroundColor Green
Write-Host "Il sito sara' visibile online tra 60 secondi."
Write-Host ""
pause
