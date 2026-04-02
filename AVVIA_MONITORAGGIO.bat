@echo off
set "SCRIPT_PATH=%~dp0MONITORA_REALTIME.ps1"
echo --------------------------------------------------------
echo    🚀 AVVIO MONITORAGGIO DASHBOARD (REAL-TIME)    
echo --------------------------------------------------------
echo.
echo Lancio in corso con privilegi di bypass...
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_PATH%"

echo.
echo --------------------------------------------------------
echo Lo script si e' interrotto. Controlla i messaggi sopra.
echo.
pause
