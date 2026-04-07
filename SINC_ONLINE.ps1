# SINC_ONLINE.ps1 - Sincronizzazione File + GitHub
# Aggiorna i file e pubblica la nuova versione della Dashboard online.

$ErrorActionPreference = "Continue"

Write-Host "----------------------------------------------------" -ForegroundColor Cyan
Write-Host "    🌐 SINC_ONLINE: AGGIORNAMENTO WEB (SOLO FILE)   " -ForegroundColor Cyan
Write-Host "----------------------------------------------------" -ForegroundColor Cyan

# 1. Esegue la Sincronizzazione Rapida
Write-Host "[1/2] Aggiornamento locale dei file..." -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -File .\SINC_RAPIDA.ps1

# 2. Invia tutto a GitHub
Write-Host "[2/2] Invio a GitHub in corso..." -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -File .\aggiorna_dashboard_online.ps1

Write-Host ""
Write-Host "✅ AGGIORNAMENTO WEB COMPLETATO!" -ForegroundColor Green
Write-Host "----------------------------------------------------" -ForegroundColor Green
Write-Host "Il sito sara' visibile online tra 60 secondi."
Write-Host ""
