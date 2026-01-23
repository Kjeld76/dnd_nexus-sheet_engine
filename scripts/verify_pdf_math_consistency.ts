
import { calculateModifier } from "../src/lib/math";

// Manual formula used previously in PDFExportService
const oldFormula = (score: number) => Math.floor((score - 10) / 2);

console.log("Starting PDF Math Consistency Verification...");

let errors = 0;
const testScores = Array.from({ length: 30 }, (_, i) => i + 1); // Test scores 1 to 30

testScores.forEach(score => {
    const newMod = calculateModifier(score);
    const oldMod = oldFormula(score);

    if (newMod !== oldMod) {
        console.error(`Status: FAILED | Score: ${score} | New: ${newMod} | Old: ${oldMod}`);
        errors++;
    } else {
        // console.log(`Status: OK | Score: ${score} | Mod: ${newMod}`);
    }
});

if (errors === 0) {
    console.log("SUCCESS: All 30 test cases passed. calculateModifier() is mathematically equivalent to the old manual formula.");
    process.exit(0);
} else {
    console.error(`FAILURE: Found ${errors} mismatches.`);
    process.exit(1);
}
