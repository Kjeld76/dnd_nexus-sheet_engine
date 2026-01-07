import { spawn } from 'child_process';
import fs from 'fs';

const sql = fs.readFileSync('tools/seeds/spell_cleanup_seed.sql', 'utf8');
const proc = spawn('sqlite3', ['dnd-nexus.db'], { stdio: ['pipe', 'inherit', 'inherit'] });

proc.stdin.write(sql);
proc.stdin.end();

proc.on('close', (code) => {
    console.log(`sqlite3 process exited with code ${code}`);
});





