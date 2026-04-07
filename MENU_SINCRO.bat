@echo off
title BUILD MANAGER - MENU SINCRONIZZAZIONE
:MENU
cls
echo ====================================================
echo      BUILD MANAGER - ASST FBF SACCO DASHBOARD
echo ====================================================
echo.
echo  SELEZIONA IL LIVELLO DI AGGIORNAMENTO:
echo.
echo  [1] SINCRO RAPIDA (Solo File Locali)
echo      - Preleva i file dal tuo OneDrive e li mette nella Dashboard.
echo      - VELOCISSIMO.
echo.
echo  [2] SINCRO ONLINE (File + Sito Web)
echo      - Preleva i file E li manda sul sito online (GitHub).
echo      - MEDIA VELOCITA'.
echo.
echo  [3] SINCRO TOTALE (File + Calcoli Excel + Sito Web)
echo      - Aggiorna scadenze, conformita' e manda tutto online.
echo      - PIU' LENTO (Consigliato una volta a settimana).
echo.
echo  [4] ESCI
echo.
echo ====================================================
set /p choice=Inserisci il numero della tua scelta: 

if '%choice%'=='1' goto RAPIDA
if '%choice%'=='2' goto ONLINE
if '%choice%'=='3' goto TOTALE
if '%choice%'=='4' goto EXIT
echo.
echo Scelta non valida, riprova...
pause
goto MENU

:RAPIDA
echo.
echo Avvio Sincronizzazione Rapida...
powershell -ExecutionPolicy Bypass -File .\SINC_RAPIDA.ps1
pause
goto MENU

:ONLINE
echo.
echo Avvio Sincronizzazione Online...
powershell -ExecutionPolicy Bypass -File .\SINC_ONLINE.ps1
pause
goto MENU

:TOTALE
echo.
echo Avvio Sincronizzazione Totale...
powershell -ExecutionPolicy Bypass -File .\SINC_TOTALE.ps1
pause
goto MENU

:EXIT
exit
