import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const backupDir = path.join(projectRoot, 'archive', 'backups');

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19).replace('T', '_');
const backupName = `backup_${timestamp}`;
const backupPath = path.join(backupDir, backupName);

const excludePatterns = [
  'node_modules',
  'dist',
  'target',
  'src-tauri/target',
  '.git',
  '.vscode',
  '.cursor',
  '.idea',
  '*.log',
  '.DS_Store',
  'Thumbs.db',
  'archive/backups',
  '.pnpm-debug.log'
];

const databases = [
  'dnd-nexus.db',
  'dnd-nexus.db.backup',
  'sync.db'
];

function createBackup() {
  console.log('═'.repeat(80));
  console.log('D&D NEXUS - PROJEKT BACKUP');
  console.log('═'.repeat(80) + '\n');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log(`📦 Erstelle Backup: ${backupName}\n`);
  console.log(`Ziel: ${backupPath}\n`);

  fs.mkdirSync(backupPath, { recursive: true });

  function shouldExclude(filePath: string): boolean {
    const relativePath = path.relative(projectRoot, filePath);
    return excludePatterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(relativePath);
      }
      return relativePath.includes(pattern);
    });
  }

  function copyRecursive(src: string, dest: string) {
    const stat = fs.statSync(src);

    if (stat.isDirectory()) {
      if (shouldExclude(src)) {
        return;
      }

      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }

      const entries = fs.readdirSync(src);
      for (const entry of entries) {
        const srcPath = path.join(src, entry);
        const destPath = path.join(dest, entry);

        if (!shouldExclude(srcPath)) {
          copyRecursive(srcPath, destPath);
        }
      }
    } else {
      if (!shouldExclude(src)) {
        fs.copyFileSync(src, dest);
      }
    }
  }

  const dirsToCopy = [
    'src',
    'src-tauri',
    'scripts',
    'docs',
    'prompts',
    'resources',
    'wiki'
  ];

  const filesToCopy = [
    'package.json',
    'pnpm-lock.yaml',
    'tsconfig.json',
    'tsconfig.node.json',
    'vite.config.ts',
    'vitest.config.ts',
    'tailwind.config.js',
    'postcss.config.js',
    'index.html',
    'app-icon.svg',
    'README.md',
    'CHANGELOG.md',
    'CHECKLIST.md',
    'RELEASE_GUIDE.md',
    'PROJEKTSTRUKTUR.md',
    'PERFORMANCE_ANALYSE.md',
    'Console.txt'
  ];

  console.log('📁 Kopiere Verzeichnisse...');
  for (const dir of dirsToCopy) {
    const srcPath = path.join(projectRoot, dir);
    if (fs.existsSync(srcPath)) {
      console.log(`   ✓ ${dir}`);
      copyRecursive(srcPath, path.join(backupPath, dir));
    }
  }

  console.log('\n📄 Kopiere Dateien...');
  for (const file of filesToCopy) {
    const srcPath = path.join(projectRoot, file);
    if (fs.existsSync(srcPath)) {
      console.log(`   ✓ ${file}`);
      fs.copyFileSync(srcPath, path.join(backupPath, file));
    }
  }

  console.log('\n💾 Kopiere Datenbanken...');
  for (const db of databases) {
    const srcPath = path.join(projectRoot, db);
    if (fs.existsSync(srcPath)) {
      console.log(`   ✓ ${db}`);
      fs.copyFileSync(srcPath, path.join(backupPath, db));
    }
  }

  const backupInfo = {
    timestamp: new Date().toISOString(),
    backupName,
    databases: databases.filter(db => 
      fs.existsSync(path.join(projectRoot, db))
    ),
    projectVersion: getProjectVersion()
  };

  fs.writeFileSync(
    path.join(backupPath, 'backup-info.json'),
    JSON.stringify(backupInfo, null, 2)
  );

  const backupSize = getDirectorySize(backupPath);
  console.log(`\n✅ Backup abgeschlossen!`);
  console.log(`   Größe: ${formatBytes(backupSize)}`);
  console.log(`   Pfad: ${backupPath}\n`);

  console.log('═'.repeat(80));
}

function getProjectVersion(): string {
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8')
    );
    return packageJson.version || 'unknown';
  } catch {
    return 'unknown';
  }
}

function getDirectorySize(dirPath: string): number {
  let size = 0;
  try {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        size += getDirectorySize(filePath);
      } else {
        size += stat.size;
      }
    }
  } catch {
    // Ignore errors
  }
  return size;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

createBackup();
