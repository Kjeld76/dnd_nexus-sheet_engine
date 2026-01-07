import fs from 'fs/promises';

async function main() {
    const speciesData = JSON.parse(await fs.readFile('tools/intermediate_data/extracted_species.json', 'utf8'));
    
    const speciesTraits: Record<string, string[]> = {
        "AASIMAR": ["Dunkelsicht", "Heilende Hände", "Lichtträger", "Celestische Offenbarung", "Himmlische Flügel", "Inneres Strahlen", "Nekrotische Spukgestalt"],
        "DRACHENBLÜTIGER": ["Drakonische Abstammung", "Drakonischer Flug", "Dunkelsicht", "Odemwaffe", "Schadensresistenz"],
        "ELF": ["Dunkelsicht", "Eifische Abstammung", "Feenblut", "Scharfe Sinne", "Trance"],
        "GNOM": ["Gnomische Abstammung", "Gnomische Gerissenheit", "Felsengnom", "Waldgnom"],
        "GOLIATH": ["Ahne der Riesen", "Großer Körperbau", "Harte Schale"],
        "HALBLING": ["Mutig", "Halbling-Gewandtheit", "Glückspilz", "Tapfer"],
        "MENSCH": ["Vielseitig", "Entschlossen"],
        "TIEFLING": ["Dunkelsicht", "Andere Welten", "Tiefling-Abstammung"],
        "ZWERG": ["Dunkelsicht", "Zwergische Unverwüstlichkeit", "Zwergische Zähigkeit", "Steingespür"],
        "ORK": ["Dunkelsicht", "Aggressiv", "Mächtiger Körperbau", "Unerbittliche Ausdauer"]
    };

    const traitManuelleKorrekturen: Record<string, string> = {
        "Dunkelsicht": "Du hast Dunkelsicht mit einer Reichweite von 18 Metern.",
        "Steingespür": "Als Bonusaktion erhältst du zehn Minuten lang Erschütterungssinn mit einer Reichweite von 18 Metern. Du musst dich auf einer steinernen Oberfläche befinden oder eine solche berühren, um den Erschütterungssinn nutzen zu können. Die Häufigkeit entspricht deinem Übungsbonus. Du erhältst alle Anwendungen nach einer langen Rast zurück.",
        "Zwergische Unverwüstlichkeit": "Du bist gegen Giftschaden resistent. Außerdem bist du bei Rettungswürfen zum Vermeiden oder Beenden des Zustands Vergiftet im Vorteil.",
        "Zwergische Zähigkeit": "Dein Trefferpunktemaximum wird um 1 und bei jedem Stufenaufstieg um 1 weiteren Punkt erhöht.",
        "Andere Welten": "Du hast eines der folgenden Erben: Abyssischer Tiefling, Chthonischer Tiefling oder Infernalischer Tiefling. Dies bestimmt deinen Zaubertrick und deine Resistenzen.",
        "Tiefling-Abstammung": "Du beherrscht zusätzliche Zauber basierend auf deinem Erbe.",
        "Vielseitig": "Du erhältst ein Herkunftstalent deiner Wahl. Außerdem bist du in einer Fertigkeit deiner Wahl geübt.",
        "Entschlossen": "Wenn du bei einer W20-Prüfung eine 1 würfelst, erhältst du Heldische Inspiration.",
        "Schadensresistenz": "Du bist gegen die Schadensart resistent, die mit deiner drakonischen Abstammung assoziiert ist.",
        "Drakonische Abstammung": "Deine Abstammungslinie geht auf einen Drachenvorfahren zurück. Wähle die Art des Drachen aus der Tabelle „Drakonische Ahnen\" aus. Diese Entscheidung bestimmt deine Odemwaffe, deine Schadensresistenz sowie dein Erscheinungsbild.",
        "Odemwaffe": "Wenn du in deinem Zug die Angriffsaktion ausführst, kannst du einen der Angriffe durch ein Ausatmen magischer Energie ersetzen (Kegel 4,5m oder Linie 9m). Schadenstyp nach drakonischer Abstammung. Schaden skaliert mit Stufe.",
        "Eifische Abstammung": "Du bist Teil einer Abstammungslinie (Drow, Hochelf, Waldelf), die dir übernatürliche Fähigkeiten und Zauber gewährt.",
        "Trance": "Du musst nicht schlafen und kannst eine lange Rast in vier Stunden beenden, wenn du diese Stunden in tranceartiger Meditation verbringst."
    };

    const fixedData = speciesData.map((s: any) => {
        const name = s.name.toUpperCase();
        const allowedTraitNames = speciesTraits[name] || [];
        
        // PHB 2024 values
        let speed = 9;
        if (name === "GOLIATH") speed = 10.5;
        s.speed = speed;

        // Build existing traits map
        const existingTraitsMap = new Map();
        for (const t of s.traits) {
            existingTraitsMap.set(t.name, t);
        }

        // Reconstruct traits array
        s.traits = allowedTraitNames.map(tName => {
            let trait = existingTraitsMap.get(tName) || { name: tName, description: "", mechanical_effect: {} };
            
            if (traitManuelleKorrekturen[tName]) {
                trait.description = traitManuelleKorrekturen[tName];
            } else {
                // If it exists but has a very long polluted description, truncate it at common junk patterns
                let desc = trait.description;
                const junkMarkers = ["Die ersten Elfen", "KAPITEL", "IN DIESEM KAPITEL", "KATEGORIE", "VORAUSSETZUNG", "VORZUG", "KANN WIEDERHOLT WERDEN", "MERKMALE DER"];
                for (const marker of junkMarkers) {
                    const idx = desc.indexOf(marker);
                    if (idx !== -1 && idx > 50) desc = desc.substring(0, idx);
                }
                trait.description = desc.trim();
            }
            return trait;
        }).filter(t => t.description.length > 5);

        return s;
    });

    await fs.writeFile('tools/intermediate_data/extracted_species.json', JSON.stringify(fixedData, null, 2));
    console.log('Final Species Cleanup complete.');
}

main();
