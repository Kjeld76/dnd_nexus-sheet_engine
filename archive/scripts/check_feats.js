const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('dnd-nexus.db');
db.all("SELECT name, category, json_extract(data, '$.prerequisite') as prereq, json_extract(data, '$.description') as desc FROM core_feats WHERE name IN ('GABE DER ENERGIERESISTENZ', 'ATTRIBUTSWERTERHÖHUNG', 'ABFANGEN', 'ZÄH')", (err, rows) => {
    if (err) console.error(err);
    rows.forEach(r => {
        console.log(`--- ${r.name} (${r.category}) ---`);
        console.log(`Prereq: ${r.prereq}`);
        console.log(`Desc Length: ${r.desc.length}`);
        console.log(`Desc: ${r.desc.substring(0, 200)}...`);
    });
    db.close();
});






