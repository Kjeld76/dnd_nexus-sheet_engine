import { parseDOCX } from './tools/parser/extract';
import fs from 'fs/promises';

async function debug() {
    const text = await parseDOCX('D&D Spielerhandbuch (2024).docx');
    const index = text.indexOf('TIERSINN');
    if (index !== -1) {
        console.log('--- TIERSINN CONTEXT ---');
        console.log(text.substring(index - 50, index + 500));
        console.log('--- END ---');
    }
}

debug().catch(console.error);

