@echo off
set "SCRIPT_PATH=%~dp0MONITORA_REALTIME.ps1"

:RESTART
cls
echo --------------------------------------------------------
echo    🚀 BUILD MANAGER: MONITORAGGIO ATTIVO
echo --------------------------------------------------------
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_PATH%"

echo.
echo --------------------------------------------------------
echo !! Sistema Interrotto !!
echo Riavvio automatico tra 5 secondi... (Ctrl+C per fermare)
echo --------------------------------------------------------
timeout /t 5
goto RESTART
