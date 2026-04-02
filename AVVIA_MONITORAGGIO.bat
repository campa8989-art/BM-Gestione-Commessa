@echo off
set "SCRIPT_PATH=%~dp0MONITORA_REALTIME.ps1"

:RESTART
cls
echo --------------------------------------------------------
echo    🚀 AVVIO MONITORAGGIO DASHBOARD (REAL-TIME)    
echo    Status: In esecuzione... (Chiudi questa finestra per fermare)
echo --------------------------------------------------------
echo.
echo Lancio in corso con privilegi di bypass...
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_PATH%"

echo.
echo --------------------------------------------------------
echo !! ATTENZIONE: Lo script si e' interrotto !!
echo Riavvio automatico tra 5 secondi... (Ctrl+C per fermare)
echo --------------------------------------------------------
timeout /t 5
goto RESTART
