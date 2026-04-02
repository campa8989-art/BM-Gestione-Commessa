# SCRIPT: CREAZIONE MASSIVA STRUTTURA LOCALI MEDICI
# Questo script crea la cartella 'Locali uso medico G0_G1_G2' in tutti i 33 presidi.

$RootPath = ".\01-Operation\05 - Servizi\DICHIARAZIONI DI CONFORMITA' (DI.CO)"
$FolderName = "Locali uso medico G0_G1_G2"
$PlaceholderFile = "placeholder.txt"

Write-Host "----------------------------------------------------" -ForegroundColor Cyan
Write-Host "    AVVIO CREAZIONE STRUTTURA LOCALI MEDICI...       " -ForegroundColor Cyan
Write-Host "----------------------------------------------------" -ForegroundColor Cyan

if (-not (Test-Path $RootPath)) {
    Write-Error "ERRORE: La cartella radice '$RootPath' non è stata trovata. Assicurati di eseguire lo script dalla root del progetto."
    exit
}

# Recuperiamo tutte le cartelle dei presidi (01-33)
$Presidi = Get-ChildItem -LiteralPath $RootPath -Directory

Write-Host "Trovati $($Presidi.Count) presidi..." -ForegroundColor Yellow

foreach ($Presidio in $Presidi) {
    # Costruiamo il percorso target
    $TargetDir = Join-Path $Presidio.FullName $FolderName
    
    if (-not (Test-Path $TargetDir)) {
        # Creazione cartella
        New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
        
        # Creazione file segnaposto (richiesto dall'utente)
        $PlaceholderPath = Join-Path $TargetDir $PlaceholderFile
        "Area dedicata alle dichiarazioni di conformità per locali uso medico G0-G1-G2 di questo presidio." | Out-File $PlaceholderPath -Encoding UTF8
        
        Write-Host "[NUOVO] $($Presidio.Name) -> Created" -ForegroundColor Green
    } else {
        Write-Host "[OK]    $($Presidio.Name) -> Already exists" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "----------------------------------------------------" -ForegroundColor Green
Write-Host "         OPERAZIONE COMPLETATA CON SUCCESSO!       " -ForegroundColor Green
Write-Host "----------------------------------------------------" -ForegroundColor Green
Write-Host "Ricordati di cliccare 'Sincronizza Archivio' sulla Dashboard per vedere le nuove cartelle." 
pause
