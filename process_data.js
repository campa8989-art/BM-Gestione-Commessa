const fs = require('fs');
const path = require('path');

// Paths
const csvFile = 'c:\\Users\\PC\\OneDrive - MANUTENCOOP Facility Management S.p.A\\BM ivan\\BM-Gestione-Commessa\\01-Operation\\01_Operations_Standard\\csv\\Master_Scadenzario_33_Siti_Full_v3.csv';
const masterFile = 'c:\\Users\\PC\\OneDrive - MANUTENCOOP Facility Management S.p.A\\BM ivan\\BM-Gestione-Commessa\\01-Operation\\01_Operations_Standard\\csv\\Master_Facility_List_Validated.csv';
const outputFile = 'c:\\Users\\PC\\OneDrive - MANUTENCOOP Facility Management S.p.A\\BM ivan\\BM-Gestione-Commessa\\data.js';

// Site Lookup
const masterContent = fs.readFileSync(masterFile, 'utf8');
const siteLines = masterContent.split('\n').filter(l => l.trim());
const siteLookup = {};
siteLines.slice(1).forEach(line => {
    const [id, name, addr] = line.split(',');
    siteLookup[id] = { name, addr };
});

// CSV Parsing
const csvContent = fs.readFileSync(csvFile, 'utf8');
const csvLines = csvContent.split('\n').filter(l => l.trim());
const rows = csvLines.slice(1).map(line => {
    const parts = line.split(';').map(p => p.replace(/"/g, ''));
    if (parts.length < 5) return null;
    
    const idSito = parts[0];
    const siteInfo = siteLookup[idSito] || { name: parts[2], addr: "TBD" };
    
    return {
        ID_Sito: idSito,
        Nome_Sito: siteInfo.name,
        Indirizzo: siteInfo.addr,
        Sistema: parts[1],
        Attivita: parts[3],
        Frequenza: parts[4],
        Normativa: parts[5],
        Stato_Documentale: "DA VERIFICARE",
        Note: parts[9] || "",
        Last_Date: "",
        Next_Date: "2026-06-15",
        Urgency: "Normal"
    };
}).filter(r => r);

const jsContent = `const maintenanceData = ${JSON.stringify(rows, null, 2)};`;
fs.writeFileSync(outputFile, jsContent, 'utf8');
console.log(`Generated data.js with ${rows.length} entries.`);
