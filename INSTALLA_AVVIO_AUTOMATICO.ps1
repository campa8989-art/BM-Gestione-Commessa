# BUILDING MANAGER PREMIUM - INSTALLAZIONE AVVIO AUTOMATICO
# Questo script crea un collegamento nella cartella 'Esecuzione Automatica' di Windows.

$ScriptDir = Split-Path $MyInvocation.MyCommand.Path -Parent
$MonitorScript = Join-Path $ScriptDir "MONITORA_REALTIME.ps1"
$StartupFolder = [System.Environment]::GetFolderPath("Startup")
$ShortcutPath = Join-Path $StartupFolder "Monitoraggio_BM_Dashboard.lnk"

Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host "   ⚙️ INSTALLAZIONE AVVIO AUTOMATICO (STARTUP)   " -ForegroundColor Cyan
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host "Percorso script: $MonitorScript"
Write-Host "Cartella Startup: $StartupFolder"
Write-Host ""

try {
    $Shell = New-Object -ComObject WScript.Shell
    $Shortcut = $Shell.CreateShortcut($ShortcutPath)
    
    # Configurazione comando: Punta direttamente al file .bat corazzato
    $Shortcut.TargetPath = Join-Path $ScriptDir "AVVIA_MONITORAGGIO.bat"
    $Shortcut.WorkingDirectory = $ScriptDir
    $Shortcut.WindowStyle = 7 # Minimized
    $Shortcut.Description = "Monitoraggio Real-Time Dashboard Building Manager"
    $Shortcut.IconLocation = "powershell.exe,0"
    
    $Shortcut.Save()
    
    Write-Host ""
    Write-Host "✅ INSTALLAZIONE COMPLETATA CON SUCCESSO!" -ForegroundColor Green
    Write-Host "Ora il monitoraggio partira' automaticamente a ogni avvio di Windows." -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ ERRORE DURANTE L'INSTALLAZIONE: $_" -ForegroundColor Red
}

Write-Host "Premi un tasto per terminare..." -ForegroundColor Gray
Read-Host | Out-Null
