# SCRIPT DI AGGIORNAMENTO DATI ARCHIVIO (WORKSPACE)
# Questo script analizza le tue cartelle su OneDrive e aggiorna la lista dei file nella Dashboard.

$ErrorActionPreference = "Continue"

# 1. Definiamo i percorsi
$ParentDir = Split-Path $PSScriptRoot -Parent
$LocalRoot = Get-Item -LiteralPath (Join-Path $ParentDir "01-ASST FBF Sacco")
$RemoteRoot = Get-Item -LiteralPath $PSScriptRoot
$indexPath = Join-Path $PSScriptRoot "index.html"
$now = Get-Date -Format "dd/MM/yyyy HH:mm:ss"

Write-Host ""
Write-Host "----------------------------------------------------" -ForegroundColor Cyan
Write-Host "    SCANSIONE CARTELLE ONEDRIVE IN CORSO...         " -ForegroundColor Cyan
Write-Host "    Percorso: $($LocalRoot.FullName)"
Write-Host "    Data/Ora: $now"
Write-Host "----------------------------------------------------" -ForegroundColor Cyan
Write-Host ""

function Get-FolderTree {
    param([string]$path, [string]$root, [string[]]$exclusions)
    
    # Escludiamo cartelle di sistema, node_modules e file non desiderati
    $items = @(Get-ChildItem -LiteralPath $path | Where-Object { 
        $name = $_.Name
        $isExcluded = $exclusions -contains $name -or $name -like ".*"
        -not $isExcluded
    } | ForEach-Object {
        $relPath = $_.FullName.Substring($root.Length).TrimStart("\")
        $item = @{
            name = $_.Name
            path = $relPath
            isDir = $_.PSIsContainer
        }
        
        if ($_.PSIsContainer) {
            $children = Get-FolderTree -path $_.FullName -root $root -exclusions $exclusions
            if ($children) {
                $item.children = @($children)
            } else {
                $item.children = @()
            }
        } else {
            $item.size = $_.Length
            $item.ext = $_.Extension
            $item.isDir = $false
        }
        
        return $item
    })
    
    return ,$items
}

# 2. Eseguiamo la scansione Duale
$GlobalExclusions = @("node_modules", "assets", ".git", ".gemini", ".agents", "aggiorna_dashboard_online.ps1", "aggiorna_dati_archivio.ps1", "SINC_TOTALE.ps1", "MONITORA_REALTIME.ps1", "INSTALLA_AVVIO_AUTOMATICO.ps1", "AVVIA_MONITORAGGIO.bat")

Write-Host "[1/2] Scansione Locale (Full folder OneDrive)..." -ForegroundColor Yellow
$ExclusionsLocal = $GlobalExclusions
$treeLocal = Get-FolderTree -path $LocalRoot.FullName -root $LocalRoot.FullName -exclusions $ExclusionsLocal
$jsonLocal = $treeLocal | ConvertTo-Json -Depth 20

Write-Host "[2/2] Scansione Remota (Solo file sincronizzati)..." -ForegroundColor Yellow
$ExclusionsRemote = $GlobalExclusions + @("06 - Contabilità", "08 - Contratto Iniziale")
$treeRemote = Get-FolderTree -path $RemoteRoot.FullName -root $RemoteRoot.FullName -exclusions $ExclusionsRemote
$jsonRemote = $treeRemote | ConvertTo-Json -Depth 20

# 4. Iniezione diretta in index.html (Zero-Cache)
if (Test-Path $indexPath) {
    # Leggiamo il file come UTF8 per preservare gli accenti
    $html = [System.IO.File]::ReadAllText($indexPath, [System.Text.Encoding]::UTF8)
    $pattern = "(?s)/\* WORKSPACE_DATA_START \*/.*?/\* WORKSPACE_DATA_END \*/"
    $replacement = "/* WORKSPACE_DATA_START */`n        const workspaceDataLocal = $jsonLocal;`n        const workspaceDataRemote = $jsonRemote;`n        const workspaceVersion = '$now';`n        /* WORKSPACE_DATA_END */"
    
    if ($html -match $pattern) {
        $newHtml = $html -replace $pattern, $replacement
        [System.IO.File]::WriteAllText($indexPath, $newHtml, [System.Text.Encoding]::UTF8)
        Write-Host "DASHBOARD AGGIORNATA CON SUCCESSO (Versione: $now)!" -ForegroundColor Green
    } else {
        Write-Warning "AVVERTENZA: Marcatori WORKSPACE_DATA non trovati in index.html. L'aggiornamento è fallito."
    }
} else {
    Write-Error "ERRORE: index.html non trovato in $indexPath"
}

Write-Host ""
Write-Host "Ora apri la Dashboard e premi il pulsante 'Sincronizza Archivio'." -ForegroundColor Cyan
Write-Host ""
