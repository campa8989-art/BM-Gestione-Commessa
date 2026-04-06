# BUILDING MANAGER PREMIUM - MONITORAGGIO REAL-TIME
# Lascia questa finestra aperta (o ridotta a icona) mentre lavori.

$SyncScript = Join-Path $PSScriptRoot "aggiorna_dati_archivio.ps1"
if (-not (Test-Path $SyncScript)) { 
    Write-Host "ERRORE: Script sync non trovato!" -ForegroundColor Red
    pause
    exit
}

Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host "   🚀 BUILD MANAGER: MONITORAGGIO ATTIVO" -ForegroundColor Cyan
Write-Host "--------------------------------------------------------"
Write-Host "Percorso: $PSScriptRoot"
Write-Host ""

# Configurazione FileSystemWatcher
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $PSScriptRoot
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true
$watcher.NotifyFilter = [System.IO.NotifyFilters]::FileName -bor [System.IO.NotifyFilters]::LastWrite

$Global:lastRun = [DateTime]::MinValue

$action = {
    $now = Get-Date
    if ($EventArgs.Name -match "index\.html|data\.js|intelligence_kb\.json") { return }
    if ($now -gt $Global:lastRun.AddSeconds(2)) {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 🔄 Aggiornamento Dashboard..." -ForegroundColor Yellow
        powershell.exe -ExecutionPolicy Bypass -NoProfile -File "$SyncScript"
        $Global:lastRun = $now
    }
}

Register-ObjectEvent $watcher "Changed" -Action $action -MessageData $SyncScript | Out-Null
Register-ObjectEvent $watcher "Created" -Action $action -MessageData $SyncScript | Out-Null

Write-Host "✅ Sincronizzazione automativa attiva." -ForegroundColor Green
Write-Host "Premi Ctrl+C per fermare."

while ($true) { Start-Sleep -Seconds 1 }
