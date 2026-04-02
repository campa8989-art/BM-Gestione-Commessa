# Audit Consistenze: ARIA 2024 vs. Baseline Operativa 2026
**Commessa**: ASST FBF Sacco - Presidi Territoriali
**Responsabile**: Ivan Campagnoli (BM)
**Data**: 02 Aprile 2026

## 1. Obiettivo dell'Audit
Verifica tecnica delle consistenze degli asset (quantità, frequenze e normative) tra i dati di gara ARIA 2024 (colonne C, D, E, F, G) e il censimento reale aggiornato alla fase di Mobilizzazione (Phase-In).

## 2. Sintesi Discrepanze Rilevate

> [!WARNING]
> **DISCREPANZA CRITICA: Via Andrea Doria 52 (ID 01)**
> - **Sistema**: Antincendio (Estintori)
> - **Contratto ARIA**: 49 unità
> - **Censimento Reale**: 54 unità
> - **Impatto**: Necessaria verifica per 5 estintori extra-canone o integrazione contrattuale.

| ID Sito | Nome Sito | Asset | Quantità ARIA | Quantità REALE | Stato |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 01 | Via Doria 52 | Estintori | 49 | **54** | ⚠️ DISCREPANZA |
| 02 | Via Don Orione 2 | Estintori | 35 | 35 | ✅ ALLINEATO |
| 03 | Via Farini 9 | Estintori | 65 | 65 | ✅ ALLINEATO |
| 04 | Via Rugabella 4/6 | Estintori | 58 | 58 | ✅ ALLINEATO |
| 05 | Via A. Sassi 4 | Estintori | 7 | 7 | ✅ ALLINEATO |
| 14 | Viale Piceno 60 | Estintori | 40 | 40 | ✅ ALLINEATO |
| 15 | Via Clericetti 22 | Estintori | 7 | 7 | ✅ ALLINEATO |

## 3. Sistemi da Verificare (Gap Documentali)
Oltre alle quantità, è stato rilevato un gap nelle frequenze per i seguenti sistemi:
- **HVAC (Sito 06 - Jolanda)**: Frequenza trimestrale in gara, censimento riporta semestrale per alcune UTA.
- **Elettrico (UPS)**: Mancanza di alcuni codici Column_D per i gruppi di continuità nei poliambulatori periferici.

## 4. Azioni Correttive Suggerite
1.  **Aggiornamento Dashboard**: I dati sono stati iniettati nel `data.js` per riflettere le quantità reali rilevate.
2.  **Verbale di Sopralluogo**: Programmare verifica fisica per i 5 estintori eccedenti in Via Doria 52 entro la W14.
3.  **Allineamento ARIA**: Inviare report ufficiale alla stazione appaltante per la ratifica delle consistenze validate.
