import fs from 'fs';

const phbText = fs.readFileSync('tools/phb_text.txt', 'utf8');
const lines = phbText.split('\n').map(l => l.trim());

const typeLines = new Set<string>();

for (const line of lines) {
    if (line.toLowerCase().includes('zauber') && line.toLowerCase().includes('grade')) {
        typeLines.add(line);
    }
}

console.log(Array.from(typeLines).slice(0, 50));





