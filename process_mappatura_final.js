
const fs = require('fs');

const masterList = [
  { ID: '01', Nome: 'Via Doria 52', Indirizzo: 'Via Andrea Doria 52' },
  { ID: '02', Nome: 'Via Don Orione 2', Indirizzo: 'Via Don Orione 2' },
  { ID: '03', Nome: 'Via Farini 9', Indirizzo: 'Via Carlo Farini 9' },
  { ID: '04', Nome: 'Via Rugabella 4_6', Indirizzo: 'Via Rugabella 4' },
  { ID: '05', Nome: 'Via Sassi 4', Indirizzo: 'Via Sassi 4' },
  { ID: '06', Nome: 'Principessa Jolanda', Indirizzo: 'Piazza Principessa Jolanda' },
  { ID: '07', Nome: 'Viale Jenner 44', Indirizzo: 'Viale Jenner 44' },
  { ID: '08', Nome: 'Via Livigno 3', Indirizzo: 'Via Livigno 3' },
  { ID: '09', Nome: 'Via Calvairate 1', Indirizzo: 'Via Calvairate 1' },
  { ID: '10', Nome: 'Via Polesine 6', Indirizzo: 'Via Polesine 6' },
  { ID: '11a', Nome: 'Via Adriano 107', Indirizzo: 'Via Adriano 107' },
  { ID: '11b', Nome: 'Via Adriano 99', Indirizzo: 'Via Adriano 99' },
  { ID: '12', Nome: 'POT Bollate', Indirizzo: 'Via (Bollate)' },
  { ID: '14', Nome: 'Viale Piceno 60', Indirizzo: 'Viale Piceno 60' },
  { ID: '15', Nome: 'Via Clericetti 22', Indirizzo: 'Via Clericetti 22' },
  { ID: '16', Nome: 'Via Don Bosco 14', Indirizzo: 'Via Don Bosco 14' },
  { ID: '17', Nome: 'Via Fantoli 7', Indirizzo: 'Via Fantoli 7' },
  { ID: '18', Nome: 'Via Palombino 4', Indirizzo: 'Via Monte Palombino 4' },
  { ID: '19', Nome: 'Via Quarenghi 21', Indirizzo: 'Via Quarenghi 21' },
  { ID: '20', Nome: 'Via Aldini 72', Indirizzo: 'Via Aldini 72' },
  { ID: '21', Nome: 'Via Perini 22', Indirizzo: 'Via Perini 22' },
  { ID: '22', Nome: 'Via Cilea 146A', Indirizzo: 'Via Francesco Cilea 146A' },
  { ID: '23', Nome: 'Via Sanzio 9', Indirizzo: 'Via Raffaello Sanzio 9' },
  { ID: '24', Nome: 'Via Statuto 5', Indirizzo: 'Via Statuto 5' },
  { ID: '25', Nome: 'Via Erlembaldo 4D', Indirizzo: 'Via S. Erlembaldo 4D' },
  { ID: '26', Nome: 'Via Padova 118', Indirizzo: 'Via Padova 118' },
  { ID: '27', Nome: 'L.go Volontari del sangue 1', Indirizzo: 'Largo Volontari del Sangue 1' },
  { ID: '28', Nome: 'Via Plebisciti 4', Indirizzo: 'Corso Plebisciti 4' },
  { ID: '29', Nome: 'Via Serlio 8', Indirizzo: 'Via Serlio 8' },
  { ID: '31', Nome: 'V.le Puglie 33', Indirizzo: 'Viale Puglie 33' },
  { ID: '32', Nome: 'Via Natta 19', Indirizzo: 'Via Giulio Natta 19' },
  { ID: '33', Nome: 'Via Oglio 4', Indirizzo: 'Via Oglio 4' },
  { ID: '34', Nome: 'Magazzino/Uffici', Indirizzo: 'TBD' }
];

const csvPath = '01-Operation/01_Operations_Standard/csv/Mappatura_Manutenzioni_Sacco_Ordinata_TOTALE.csv';
const content = fs.readFileSync(csvPath, 'utf8');
const lines = content.split('\n');

function normalize(s) {
  if (!s) return "";
  return s.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

const csvData = [];
lines.slice(1).forEach(line => {
  if (!line.trim()) return;
  const cols = line.split(',');
  
  let addr = "", sys = "", activity = "", qty = "", freq = "", norm = "", notes = "", lastDate = "";
  
  // Detect shift: if first col is a system name
  const isSysFirst = ["ANTINCENDIO", "ELETTRICI", "MECCANICI", "ELEVATORI", "EDILE", "LEGIONELLA"].includes(cols[0]?.trim().toUpperCase());
  
  if (isSysFirst) {
    sys = cols[0];
    activity = cols[1];
    qty = cols[2];
    addr = cols[3];
    freq = cols[4];
    norm = cols[6];
    notes = cols[7];
  } else {
    addr = cols[0];
    sys = cols[1];
    activity = cols[2];
    qty = cols[3];
    freq = cols[4];
    norm = cols[6];
    notes = cols[7];
  }
  
  csvData.push({ addr, sys, activity, qty, freq, norm, notes });
});

const maintenanceData = [];

masterList.forEach(site => {
  const normMasterName = normalize(site.Nome);
  const normMasterAddr = normalize(site.Indirizzo);
  
  const siteTasks = csvData.filter(d => {
    const nAddr = normalize(d.addr);
    return nAddr.includes(normMasterName) || nAddr.includes(normMasterAddr) || normMasterAddr.includes(nAddr);
  });
  
  if (siteTasks.length === 0) {
    maintenanceData.push({
      ID_Sito: site.ID,
      Nome_Sito: site.Nome,
      Indirizzo: site.Indirizzo,
      Sistema: "Censimento",
      Attivita: "Censimento asset in corso...",
      Frequenza: "---",
      Normativa: "---",
      Stato_Documentale: "DA VERIFICARE",
      Note: "Sito aggiunto da Master List",
      Last_Date: null,
      Next_Date: "2026-06-15",
      Urgency: "Normal"
    });
  } else {
    siteTasks.forEach(t => {
      maintenanceData.push({
        ID_Sito: site.ID,
        Nome_Sito: site.Nome,
        Indirizzo: site.Indirizzo,
        Sistema: t.sys || "N/A",
        Attivita: `${t.qty || "0"} n.ro x ${t.activity || "Asset"}`,
        Frequenza: t.freq || "Periodica",
        Normativa: t.norm || "Normativa vigente",
        Stato_Documentale: "DA VERIFICARE",
        Note: t.notes || "",
        Last_Date: null,
        Next_Date: "2026-06-15",
        Urgency: "Normal"
      });
    });
  }
});

const output = `const maintenanceData = ${JSON.stringify(maintenanceData, null, 2)};`;
fs.writeFileSync('data.js', output);
console.log("data.js generated with " + maintenanceData.length + " tasks across 33+ sites.");
