# SCRIPT: SMART MIRROR SYNC (Archive -> Workspace)
# Sincronizza i file dall'archivio master alla cartella operativa della Dashboard evitando i file sensibili.

$ParentDir = Split-Path $PSScriptRoot -Parent
$Source = Join-Path $ParentDir "01-ASST FBF Sacco\01-Operation"
$Destination = Join-Path $PSScriptRoot "01-Operation"

# Cartelle da escludere (Privacy & Sicurezza)
$Exclusions = @("06 - Contabilità", "08 - Contratto Iniziale", "tmp", "node_modules", ".git")

Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host "    🚀 SMART MIRROR: ARCHIVIO -> WORKSPACE             " -ForegroundColor Cyan
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan

if (-not (Test-Path $Source)) {
    Write-Error "ERRORE: Sorgente non trovata in $Source"
    exit
}

Write-Host "Sorgente: $Source"
Write-Host "Destinazione: $Destination"
Write-Host ""

# Esecuzione Robocopy
# /MIR  : Mirror (Sincronizza tutto, elimina se rimosso in sorgente)
# /XD   : Exclude Directories
# /R:2  : Retry 2 volte se file bloccato
# /W:5  : Wait 5 secondi tra i retry
# /NJH /NJS : Riduce il rumore nel log
# /MT:8 : Multi-threaded (più veloce)

$RoboArgs = @(
    "$Source",
    "$Destination",
    "/MIR",
    "/XD"
) + $Exclusions + @(
    "/R:2",
    "/W:5",
    "/MT:8",
    "/NDL",
    "/NC",
    "/NS",
    "/NP"
)

Write-Host "Inizio sincronizzazione fisica dei file..." -ForegroundColor Yellow
robocopy @RoboArgs

Write-Host ""
Write-Host "✅ Sincronizzazione Mirror completata." -ForegroundColor Green
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
