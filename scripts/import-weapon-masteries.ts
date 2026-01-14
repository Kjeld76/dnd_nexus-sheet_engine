import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve('./dnd-nexus.db');
const db = new Database(dbPath);

interface WeaponMastery {
    id: string;
    name: string;
    description: string;
    data?: string | null;
}

const masteries: WeaponMastery[] = [
    {
        id: 'auslaugen',
        name: 'Auslaugen',
        description: 'Wenn du eine Kreatur mit dieser Waffe triffst, ist diese Kreatur bei ihrem nächsten Angriffswurf vor Beginn deines nächsten Zugs im Nachteil.'
    },
    {
        id: 'einkerben',
        name: 'Einkerben',
        description: 'Wenn du den zusätzlichen Angriff der Eigenschaft Leicht ausführst, kannst du dies als Teil der Angriffsaktion statt als Bonusaktion tun. Du kannst diesen zusätzlichen Angriff nur einmal pro Zug ausführen.'
    },
    {
        id: 'plagen',
        name: 'Plagen',
        description: 'Wenn du eine Kreatur mit dieser Waffe triffst und ihr Schaden zufügst, bist du beim nächsten Angriffswurf gegen diese Kreatur vor Ende deines nächsten Zugs im Vorteil.'
    },
    {
        id: 'spalten',
        name: 'Spalten',
        description: 'Wenn du eine Kreatur mit einem Nahkampfangriffswurf triffst, den du mit dieser Waffe ausführst, kannst du mit der Waffe einen weiteren Nahkampfangriff auf eine zweite Kreatur im Abstand von bis zu 1,5 Metern von der ersten ausführen, sofern die zweite sich ebenfalls in Reichweite befindet. Bei einem Treffer erleidet die Kreatur den Waffenschaden. Du fügst dem Schaden jedoch nicht deinen Attributsmodifikator hinzu, sofern dieser Modifikator nicht negativ ist. Du kannst diesen zusätzlichen Angriff nur einmal pro Zug ausführen.'
    },
    {
        id: 'stossen',
        name: 'Stoßen',
        description: 'Wenn du eine Kreatur mit dieser Waffe triffst, kannst du sie bis zu drei Meter weit in gerader Linie von dir wegstoßen, sofern sie von höchstens großer Größe ist.'
    },
    {
        id: 'streifen',
        name: 'Streifen',
        description: 'Wenn dein Angriffswurf mit dieser Waffe eine Kreatur verfehlt, kannst du der Kreatur Schaden in Höhe des Attributsmodifikators zufügen, den du für den Angriffswurf verwendet hast. Die Schadensart entspricht der Waffe. Der Schaden kann nur durch Erhöhen des Attributsmodifikators erhöht werden.'
    },
    {
        id: 'umstossen',
        name: 'Umstoßen',
        description: 'Wenn du eine Kreatur mit dieser Waffe triffst, kannst du sie zu einem Konstitutionsrettungswurf (SG 8 plus Attributsmodifikator für den Angriffswurf plus dein Übungsbonus) zwingen. Scheitert der Wurf, so wird die Kreatur umgestoßen.'
    },
    {
        id: 'verlangsamen',
        name: 'Verlangsamen',
        description: 'Wenn du eine Kreatur mit dieser Waffe triffst und ihr Schaden zufügst, kannst du ihre Bewegungsrate bis zum Beginn deines nächsten Zugs um drei Meter verringern. Wird die Kreatur mehrfach von Waffen mit dieser Eigenschaft getroffen, so wird ihre Bewegungsrate dennoch nur um drei Meter verringert.'
    }
];

async function importMasteries() {
    console.log('📦 Importiere Waffen-Meisterschaften...\n');

    const insert = db.prepare(`
        INSERT OR REPLACE INTO weapon_masteries (
            id, name, description, data
        ) VALUES (?, ?, ?, ?)
    `);

    const transaction = db.transaction((masters: WeaponMastery[]) => {
        for (const mastery of masters) {
            insert.run(
                mastery.id,
                mastery.name,
                mastery.description,
                mastery.data || null
            );
        }
    });

    transaction(masteries);

    console.log(`✅ ${masteries.length} Meisterschaften importiert:\n`);
    masteries.forEach(mastery => {
        console.log(`   • ${mastery.name} (${mastery.id})`);
    });
}

try {
    importMasteries();
    console.log('\n✅ Import abgeschlossen!');
} catch (error) {
    console.error('\n❌ FEHLER:', error);
    process.exit(1);
} finally {
    db.close();
}
