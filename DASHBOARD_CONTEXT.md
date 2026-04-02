# Dashboard Context: ASST FBF Sacco Management

## 📌 Project Overview
Project for the standardization and proactive management of maintenance for **33 facilities** of ASST FBF Sacco, managed by Ivan Campagnoli (Building Manager).

## 📂 Professional Structure (Actual Layout)
- `BM-Gestione-Commessa\`: Root del Repository Dashboard (HTML, CSS, JS).
  - `01-Operation\`: Sotto-cartelle sincronizzate e visibili online (es. 05-Servizi).
- `01-ASST FBF Sacco\`: Database sorgente OneDrive (Full Archive).
- `Scripts & Automation`:
  - `SINC_TOTALE.ps1`: Master script per aggiornamento dati e push GitHub (Unico Entry Point).
  - `sync_data.ps1`: Mappatura intelligente tra Piano Manutentivo e Master List Anagrafica.
  - `aggiorna_dati_archivio.ps1`: Dual-scan (Local vs Remote) per navigazione intelligente.
  - `aggiorna_dashboard_online.ps1`: Gestione sincronizzazione cartelle e privacy.

## 🚀 Status as of 02 April 2026 (UI & Data Stability Update)
- **Standardizzazione ARIA 2024**: Allineamento totale degli ID Presidio con la tabella ufficiale Gara ARIA 2024 (ID da 01 a 33).
- **Core Engine Hardening**: Implementati controlli di sicurezza (null-checking) su variabili e layout per prevenire "White Screen of Death" durante il rendering iniziale. 
- **Gestione Datasets Modulari**: Ripristino e consolidamento dei collegamenti a `data.js` e script esterni, con salvataggio sicuro in ambiente locale e remoto (`window.workspaceData`).
- **Architettura Strutturata**: Chiusura bug di visualizzazione causati da tag HTML spaiati, garantendo l'integrità del design Emerald Glassmorphism.
- **Supporto Offline**: Caching automatico dei dati in `localStorage` con indicatori di stato real-time.
- **Verifica Documentale Dinamica**: Scansione real-time della cartella `05-servizi` per validazione "REALE" degli interventi tramite match parole chiave Sito/Sistema.

## ✅ Dashboard — Features Disponibili
- [x] **Scheda Presidio**: Vista dettagliata per singolo sito con Anagrafica e Storico.
- [x] **Calendario Manutenzioni**: Navigazione temporale delle scadenze per sito.
- [x] **Archivio Intelligente**: Browser file integrato con ricerca e verifica documentale.
- [x] **Analytics Fleet Control**: Classifiche performance Top/Bottom e statistiche aggregate.
- [x] **Export Engine**: Generazione Report Globale PDF (Flotta) e Export Excel/PDF (Sito).
- [x] **Mappa Territoriale**: Visualizzazione geografica conforme/non conforme.
- [x] **Emerald Glassmorphism**: UI Premium con supporto Dark/Light mode dinamica su grafici.

## 🛠 Roadmap Operativa (Next Steps)
- [ ] **Maturity Score**: Calcolo automatico della conformità documentale pesata per criticità sistema.
- [ ] **Trend Storico**: Visualizzazione della progressione conformità mese dopo mese (Richiede archivio storico dati).

---
*Ultimo aggiornamento: 02/04/2026 — Antigravity / Ivan Campagnoli — UI Stabilization & Core Data Routing*
