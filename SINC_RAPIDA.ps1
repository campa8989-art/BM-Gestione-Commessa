# SINC_RAPIDA.ps1 - Sincronizzazione File Locale
# Aggiorna i file dall'archivio master e rinfresca l'indice della Dashboard (Solo Locale).

$ErrorActionPreference = "Continue"

Write-Host "----------------------------------------------------" -ForegroundColor Cyan
Write-Host "    🚀 SINC_RAPIDA: AGGIORNAMENTO FILE LOCALI       " -ForegroundColor Cyan
Write-Host "----------------------------------------------------" -ForegroundColor Cyan

# 1. Mirroring fisico dall'Archivio Master
Write-Host "[1/2] Sincronizzazione fisica dall'Archivio Master..." -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -File .\sync_archive_to_workspace.ps1

# 2. Aggiorna l'elenco dei file (Workspace)
Write-Host "[2/2] Scansione dei file OneDrive (Workspace)..." -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -File .\aggiorna_dati_archivio.ps1

Write-Host ""
Write-Host "✅ AGGIORNAMENTO LOCALE COMPLETATO!" -ForegroundColor Green
Write-Host "----------------------------------------------------" -ForegroundColor Green
Write-Host "Puoi vedere i nuovi file nella Dashboard locale."
Write-Host ""
