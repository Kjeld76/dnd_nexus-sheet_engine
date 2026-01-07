import { existsSync, mkdirSync, renameSync, readdirSync, rmSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

/**
 * Maintenance & Auto-Release Script for D&D Nexus
 * 
 * Ablauf:
 * 1. Aufräumen (dist/, tauri clean)
 * 2. Archivieren (AUDIT_REPORT.md, CHECKLIST.md, debug_*)
 * 3. Release (via scripts/release.ts)
 */

const type = process.argv[2] || 'patch';
const message = process.argv[3] || 'automated maintenance and release';

const date = new Date().toISOString().split('T')[0];
const timestamp = Date.now();
const archiveDir = path.join('archive', 'maintenance', `${date}_${timestamp}`);

function ensureDir(dir: string) {
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
}

async function run() {
    console.log("🚀 Starte Wartungsvorgang...");

    // Prüfe Branch
    const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    if (branch !== 'main') {
        console.warn(`⚠️ Warnung: Du bist auf Branch '${branch}'. Releases sollten idealerweise von 'main' erfolgen.`);
    }

    // 0. Vorab-Check (Tests & Linting)
    console.log("🔍 Überprüfe Code-Qualität...");
    try {
        console.log("   - Führe Linting aus...");
        execSync('pnpm lint', { stdio: 'inherit' });
        console.log("   - Führe Tests aus...");
        execSync('pnpm test run', { stdio: 'inherit' });
    } catch (e) {
        console.error("❌ Qualitätssicherung fehlgeschlagen! Release abgebrochen.");
        process.exit(1);
    }

    // 1. Aufräumen
    console.log("🧹 Räume Projektordner auf...");
    try {
        if (existsSync('dist')) {
            rmSync('dist', { recursive: true, force: true });
            console.log("   - dist/ entfernt");
        }
        
        // Tauri Clean für Rust Artefakte
        console.log("   - Führe Tauri Clean aus...");
        execSync('pnpm tauri clean', { stdio: 'inherit' });
    } catch (e) {
        console.warn("⚠️ Warnung beim Aufräumen:", e.message);
    }

    // 2. Archivieren
    console.log("📂 Archiviere veraltete Dateien...");
    ensureDir(archiveDir);
    
    const filesToArchive = ['AUDIT_REPORT.md', 'CHECKLIST.md'];
    filesToArchive.forEach(file => {
        if (existsSync(file)) {
            renameSync(file, path.join(archiveDir, file));
            console.log(`   - ${file} archiviert in ${archiveDir}`);
        }
    });

    // Temporäre Debug-Dateien
    const rootFiles = readdirSync('.');
    rootFiles.forEach(file => {
        if (file.startsWith('debug_') || file.endsWith('.log') || file.endsWith('.tmp') || file.startsWith('temp_')) {
            try {
                renameSync(file, path.join(archiveDir, file));
                console.log(`   - Temp-Datei archiviert: ${file}`);
            } catch (e) {
                // Ignore if busy
            }
        }
    });

    // 3. Release & Push
    console.log(`📦 Starte Release-Prozess (${type})...`);
    try {
        // Ruft das bestehende Release-Script auf
        execSync(`pnpm release ${type} "${message}"`, { stdio: 'inherit' });
    } catch (e) {
        console.error("❌ Release fehlgeschlagen!");
        process.exit(1);
    }

    console.log("\n✨ Wartung und Release erfolgreich abgeschlossen!");
}

run();

