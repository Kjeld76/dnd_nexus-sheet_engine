import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve('./dnd-nexus.db');
const db = new Database(dbPath);

interface WeaponProperty {
    id: string;
    name: string;
    description: string;
    has_parameter: boolean;
    parameter_type: string | null;
    parameter_required: boolean;
    data?: string | null;
}

const properties: WeaponProperty[] = [
    {
        id: 'finesse',
        name: 'Finesse',
        description: 'Wenn du mit Finesse-Waffen angreifst, hast du bei Angriffs- und Schadenswürfen die Wahl zwischen deinem Stärke- und deinem Geschicklichkeitsmodifikator. Du musst allerdings bei beiden Würfen denselben Modifikator verwenden.',
        has_parameter: false,
        parameter_type: null,
        parameter_required: false
    },
    {
        id: 'geschosse',
        name: 'Geschosse',
        description: 'Du kannst Waffen mit der Eigenschaft Geschosse nur für Fernkampfangriffe verwenden, wenn du über entsprechende Geschosse verfügst. Die Art der erforderlichen Geschosse ist jeweils bei der Reichweite der Waffe angegeben. Jeder Angriff verbraucht ein Geschoss.',
        has_parameter: true,
        parameter_type: 'range+ammo',
        parameter_required: true
    },
    {
        id: 'laden',
        name: 'Laden',
        description: 'Du kannst mit einer Aktion, Bonusaktion oder Reaktion immer nur ein Geschoss aus einer Waffe mit der Eigenschaft Laden abfeuern, egal, wie viele Angriffe dir zur Verfügung stehen.',
        has_parameter: false,
        parameter_type: null,
        parameter_required: false
    },
    {
        id: 'leicht',
        name: 'Leicht',
        description: 'Wenn du in deinem Zug die Angriffsaktion ausführst und mit einer leichten Waffe angreifst, kannst du später im selben Zug als Bonusaktion einen zusätzlichen Angriff ausführen, wenn du eine andere leichte Waffe in der anderen Hand hältst.',
        has_parameter: false,
        parameter_type: null,
        parameter_required: false
    },
    {
        id: 'schwer',
        name: 'Schwer',
        description: 'Du bist bei Angriffswürfen mit schweren Waffen im Nachteil, wenn du bei Nahkampfwaffen einen Stärkewert von weniger als 13 und bei Fernkampfwaffen einen Geschicklichkeitswert von weniger als 13 hast.',
        has_parameter: false,
        parameter_type: null,
        parameter_required: false
    },
    {
        id: 'vielseitig',
        name: 'Vielseitig',
        description: 'Waffen mit der Eigenschaft Vielseitig können mit einer Hand oder mit zwei Händen geführt werden. Mit der Eigenschaft wird ein Schadenswert in Klammern genannt. Diesen Schaden bewirkt die Waffe, wenn sie mit zwei Händen geführt wird.',
        has_parameter: true,
        parameter_type: 'damage',
        parameter_required: true
    },
    {
        id: 'weitreichend',
        name: 'Weitreichend',
        description: 'Bei Waffen mit der Eigenschaft Weitreichend ist die normale Angriffsreichweite um 1,5 Meter erhöht. Dies gilt auch bei Gelegenheitsangriffen.',
        has_parameter: false,
        parameter_type: null,
        parameter_required: false
    },
    {
        id: 'wurfwaffe',
        name: 'Wurfwaffe',
        description: 'Waffen mit der Eigenschaft Wurfwaffe können geworfen werden, um Fernkampfangriffe auszuführen, und sie können als Teil des Angriffs gezogen werden. Wenn es sich um eine Nahkampfwaffe handelt, die du wirfst, verwendest du bei Angriffs- und Schadenswürfen den gleichen Attributsmodifikator wie bei Nahkampfangriffen mit der Waffe.',
        has_parameter: true,
        parameter_type: 'range',
        parameter_required: true
    },
    {
        id: 'zweihaendig',
        name: 'Zweihändig',
        description: 'Waffen mit der Eigenschaft Zweihändig müssen mit zwei Händen geführt werden.',
        has_parameter: false,
        parameter_type: null,
        parameter_required: false
    },
    {
        id: 'reichweite',
        name: 'Reichweite',
        description: 'Diese Waffe hat eine Reichweite, die in Metern angegeben ist. Die erste Zahl ist die normale Reichweite, die zweite Zahl ist die maximale Reichweite.',
        has_parameter: true,
        parameter_type: 'range',
        parameter_required: true
    },
    {
        id: 'magisch',
        name: 'Magisch',
        description: 'Diese Waffe ist magisch und verleiht einen Bonus auf Angriffs- und Schadenswürfe. Der Bonus wird im parameter_value gespeichert.',
        has_parameter: true,
        parameter_type: 'bonus',
        parameter_required: true
    },
    {
        id: 'verzaubert',
        name: 'Verzaubert',
        description: 'Diese Waffe ist verzaubert und hat zusätzliche magische Eigenschaften. Die Details werden im parameter_value gespeichert.',
        has_parameter: true,
        parameter_type: 'special',
        parameter_required: true
    }
];

async function importProperties() {
    console.log('📦 Importiere Waffen-Eigenschaften...\n');

    const insert = db.prepare(`
        INSERT OR REPLACE INTO weapon_properties (
            id, name, description, has_parameter, parameter_type, parameter_required, data
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((props: WeaponProperty[]) => {
        for (const prop of props) {
            insert.run(
                prop.id,
                prop.name,
                prop.description,
                prop.has_parameter ? 1 : 0,
                prop.parameter_type,
                prop.parameter_required ? 1 : 0,
                prop.data || null
            );
        }
    });

    transaction(properties);

    console.log(`✅ ${properties.length} Eigenschaften importiert:\n`);
    properties.forEach(prop => {
        console.log(`   • ${prop.name} (${prop.id})${prop.has_parameter ? ` [${prop.parameter_type}]` : ''}`);
    });
}

try {
    importProperties();
    console.log('\n✅ Import abgeschlossen!');
} catch (error) {
    console.error('\n❌ FEHLER:', error);
    process.exit(1);
} finally {
    db.close();
}
