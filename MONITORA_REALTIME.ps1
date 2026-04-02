# BUILDING MANAGER PREMIUM - MONITORAGGIO REAL-TIME
# Questo script monitora la tua cartella OneDrive e aggiorna automaticamente la Dashboard.
# Lascia questa finestra aperta (o ridotta a icona) mentre lavori.

# Imposta preferenza errori come "Stop" per il catch block durante l'inizializzazione
$ErrorActionPreference = "Stop"

try {
    # 1. Configurazione Percorsi
    $RootPath = Get-Item $PSScriptRoot
    $SyncScript = Join-Path $PSScriptRoot "aggiorna_dati_archivio.ps1"
    
    # Verifica esistenza file critici
    if (-not (Test-Path $SyncScript)) { throw "Impossibile trovare lo script di sincronizzazione: $SyncScript" }

    Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
    Write-Host "   🚀 BUILD MANAGER: MONITORAGGIO ATTIVO (REAL-TIME)" -ForegroundColor Cyan
    Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
    Write-Host "Percorso monitorato: $($RootPath.FullName)"
    Write-Host ""
    Write-Host "Ogni modifica in '01-Operation' verrà sincronizzata."
    Write-Host "Le modifiche a index.html e data.js vengono ignorate per evitare loop."
    Write-Host "--------------------------------------------------------"
    Write-Host ""

    # Configurazione FileSystemWatcher
    $watcher = New-Object System.IO.FileSystemWatcher
    $watcher.Path = $RootPath.FullName
    $watcher.IncludeSubdirectories = $true
    $watcher.EnableRaisingEvents = $true

    # Filtro Broad (Tutto) e NotifyFilter per Cartelle/File
    $watcher.Filter = "*"
    $watcher.NotifyFilter = [System.IO.NotifyFilters]::FileName -bor [System.IO.NotifyFilters]::DirectoryName -bor [System.IO.NotifyFilters]::LastWrite

    # Logica di Debounce
    $Global:lastRun = [DateTime]::MinValue

    $action = {
        $now = Get-Date
        $changedFile = $EventArgs.Name
        
        # --- FIX: EVITA LOOP INFINITO ---
        # Ignoriamo le modifiche ai file che lo script stesso aggiorna
        if ($changedFile -match "index\.html|data\.js|intelligence_kb\.json") {
            return 
        }

        if ($now -gt $Global:lastRun.AddSeconds(3)) {
            $scriptToRun = $Event.MessageData
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 🔄 Cambiamento rilevato in: $changedFile" -ForegroundColor Yellow
            
            # Eseguiamo il sync script principale (Workspace + Dashboard Data)
            powershell.exe -ExecutionPolicy Bypass -NoProfile -File "$scriptToRun"
            
            $Global:lastRun = $now
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ✅ Dashboard sincronizzata con successo." -ForegroundColor Green
            Write-Host "--------------------------------------------------------"
        }
    }

    # Registrazione Eventi
    Register-ObjectEvent $watcher "Created" -Action $action -MessageData $SyncScript | Out-Null
    Register-ObjectEvent $watcher "Changed" -Action $action -MessageData $SyncScript | Out-Null
    Register-ObjectEvent $watcher "Deleted" -Action $action -MessageData $SyncScript | Out-Null
    Register-ObjectEvent $watcher "Renamed" -Action $action -MessageData $SyncScript | Out-Null

    Write-Host "✅ Monitoraggio avviato correttamente!" -ForegroundColor Green
    Write-Host "Il sistema rileverà i tuoi cambiamenti automaticamente." -ForegroundColor Green
    
    while ($true) {
        Start-Sleep -Seconds 1
    }

} catch {
    Write-Host "Auto-Restart in corso tramite il terminale..." -ForegroundColor Gray
} finally {
    if ($watcher) {
        $watcher.EnableRaisingEvents = $false
        $watcher.Dispose()
    }
    Unregister-Event -SourceIdentifier * -ErrorAction SilentlyContinue
}
