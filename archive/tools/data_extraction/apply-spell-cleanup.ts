import fs from 'fs';
import Database from 'better-sqlite3';

const db = new Database('dnd-nexus.db');
const sql = fs.readFileSync('tools/seeds/spell_cleanup_seed.sql', 'utf8');

const statements = sql.split(';').map(s => s.trim()).filter(s => s);

db.transaction(() => {
    for (const stmt of statements) {
        try {
            db.prepare(stmt + ';').run();
        } catch (e) {
            console.error(`Error executing statement: ${stmt.slice(0, 100)}...`);
            console.error(e);
        }
    }
})();

console.log("SQL cleanup applied successfully.");





