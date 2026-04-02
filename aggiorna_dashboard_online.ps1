# SCRIPT DI AGGIORNAMENTO AUTOMATICO DASHBOARD ONLINE
# Questo script invia i dati aggiornati a GitHub per la pubblicazione online.

$ErrorActionPreference = "Continue"
$GitPath = "git"

Write-Host ""
Write-Host "----------------------------------------------------" -ForegroundColor Cyan
Write-Host "    INVIO DATI SU GITHUB (ONLINE DASHBOARD)...     " -ForegroundColor Cyan
Write-Host "----------------------------------------------------" -ForegroundColor Cyan
Write-Host ""

# 1. Verifica se Git è installato e configurato
if (!(Get-Command $GitPath -ErrorAction SilentlyContinue)) {
    Write-Error "Git non trovato nel sistema. Installalo per procedere con l'upload online."
    return
}

# 2. Controlla modifiche pendenti
Write-Host "[1/3] Verifica modifiche locali..." -ForegroundColor Yellow
$status = & $GitPath status --porcelain

if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host ">>> Nessuna modifica rilevata. Il sito online è già aggiornato." -ForegroundColor Green
} else {
    Write-Host ">>> Modifiche rilevate. Preparazione invio..." -ForegroundColor Gray
    
    # 3. Preparazione e Commit
    Write-Host "[2/3] Creazione pacchetto di aggiornamento..." -ForegroundColor Yellow
    & $GitPath add --all
    
    # Evitiamo che cartelle pesanti se presenti accidentalmente vengano incluse
    # (Il .gitignore dovrebbe già occuparsene, ma facciamo un add pulito)
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    $commitMsg = "Auto-Sync: Aggiornamento Master Database ($timestamp)"
    
    & $GitPath commit -m $commitMsg
    
    # 4. Identificazione Ramo e Push
    Write-Host "[3/3] Invio a GitHub in corso..." -ForegroundColor Yellow
    
    # Rileva il ramo corrente per evitare errori main/master
    $currentBranch = & $GitPath branch --show-current
    if ([string]::IsNullOrWhiteSpace($currentBranch)) { $currentBranch = "main" }
    
    Write-Host ">>> Ramo rilevato: $currentBranch" -ForegroundColor Cyan
    
    $pushResult = & $GitPath push origin $currentBranch 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "----------------------------------------------------" -ForegroundColor Green
        Write-Host "           UPLOAD COMPLETATO CON SUCCESSO!          " -ForegroundColor Green
        Write-Host "----------------------------------------------------" -ForegroundColor Green
        Write-Host "Il sito sarà visibile online tra circa 60 secondi."
    } else {
        Write-Host ""
        Write-Host "ERRORE durante il push su GitHub." -ForegroundColor Red
        Write-Host "Dettaglio errore: $pushResult" -ForegroundColor White
        Write-Host "Verifica la tua connessione o le credenziali Git." -ForegroundColor Yellow
    }
}

Write-Host ""
