import mammoth from 'mammoth';
import fs from 'fs/promises';

async function dumpText() {
    const docPath = "resources/books/D&D Spielerhandbuch (2024).docx";
    const buffer = await fs.readFile(docPath);
    const { value: text } = await mammoth.extractRawText({ buffer });
    await fs.writeFile("tools/phb_text.txt", text);
    console.log("PHB text dumped to tools/phb_text.txt");
}

dumpText().catch(console.error);






