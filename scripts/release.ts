import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

// Usage: npx tsx scripts/release.ts [patch|minor|major] "Commit message"

const type = process.argv[2] || 'patch';
const message = process.argv[3] || 'chore: release new version';

function getVersion() {
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
    return pkg.version;
}

function bumpVersion(version: string, type: string) {
    const parts = version.split('.').map(Number);
    if (type === 'major') parts[0]++;
    else if (type === 'minor') parts[1]++;
    else parts[2]++;
    
    if (type === 'major' || type === 'minor') parts[2] = 0;
    if (type === 'major') parts[1] = 0;
    
    return parts.join('.');
}

function updateFile(filePath: string, oldVersion: string, newVersion: string) {
    const content = readFileSync(filePath, 'utf-8');
    const updated = content.replace(oldVersion, newVersion);
    writeFileSync(filePath, updated);
    console.log(`Updated ${filePath} to ${newVersion}`);
}

async function run() {
    const oldVersion = getVersion();
    const newVersion = bumpVersion(oldVersion, type);

    console.log(`Bumping version from ${oldVersion} to ${newVersion}...`);

    // 1. Update files
    updateFile('package.json', `"version": "${oldVersion}"`, `"version": "${newVersion}"`);
    updateFile('src-tauri/tauri.conf.json', `"version": "${oldVersion}"`, `"version": "${newVersion}"`);
    updateFile('src-tauri/Cargo.toml', `version = "${oldVersion}"`, `version = "${newVersion}"`);
    
    // Update README versioning (handles all occurrences in (vX.X.X) format)
    try {
        const readmeContent = readFileSync('README.md', 'utf-8');
        const updatedReadme = readmeContent.replace(/\(v\d+\.\d+\.\d+\)/g, `(v${newVersion})`);
        writeFileSync('README.md', updatedReadme);
        console.log(`Updated README.md version markers to v${newVersion}`);
    } catch (e) {
        console.warn('Could not update README.md:', e.message);
    }

    // 1.1 Update Wiki (if exists)
    try {
        const wikiHomePath = 'wiki/Home.md';
        if (existsSync(wikiHomePath)) {
            const wikiContent = readFileSync(wikiHomePath, 'utf-8');
            const updatedWiki = wikiContent.replace(/\*Nexus Version: v\d+\.\d+\.\d+\*/g, `*Nexus Version: v${newVersion}*`);
            writeFileSync(wikiHomePath, updatedWiki);
            console.log(`Updated ${wikiHomePath} version marker to v${newVersion}`);
            
            // Push wiki if it's a git repo
            console.log('Pushing Wiki changes...');
            execSync('cd wiki && git add . && git commit -m "Update version to v' + newVersion + '" && git push', { stdio: 'inherit' });
        }
    } catch (e) {
        console.log('No local wiki repository found or update failed. Skipping wiki automation.');
    }

    // 2. Git commands
    try {
        console.log('Staging changes...');
        execSync('git add .');
        
        console.log('Committing...');
        execSync(`git commit -m "chore: release v${newVersion} - ${message}"`);
        
        console.log('Tagging...');
        execSync(`git tag -a v${newVersion} -m "Release v${newVersion}"`);
        
        console.log('Pushing to origin...');
        execSync('git push origin main --tags');
        
        console.log(`Successfully released v${newVersion}! 🚀`);
    } catch (error) {
        console.error('Git operation failed:', error.message);
        process.exit(1);
    }
}

run();

