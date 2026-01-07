import mammoth from 'mammoth';
import fs from 'fs/promises';
import path from 'path';

const PROPERTIES = [
    {
        id: "finesse",
        name: "Finesse",
        description: "Wenn du mit Finesse-Waffen angreifst, hast du bei Angriffs- und Schadenswürfen die Wahl zwischen deinem Stärke- und deinem Geschicklichkeitsmodifikator. Du musst allerdings bei beiden Würfen denselben Modifikator verwenden.",
        data: {
            mechanical_effect: "choice(STR, DEX)",
            affects: ["attack_rolls", "damage_rolls"]
        }
    },
    {
        id: "ammunition",
        name: "Geschosse",
        description: "Du kannst Waffen mit der Eigenschaft Geschosse nur für Fernkampfangriffe verwenden, wenn du über entsprechende Geschosse verfügst. Jeder Angriff verbraucht ein Geschoss. Es ist Teil des Angriffs, die Waffe mit Geschossen zu laden.",
        data: {
            mechanical_effect: "requires_ammo",
            affects: ["ranged_attacks"]
        }
    },
    {
        id: "loading",
        name: "Laden",
        description: "Du kannst mit einer Aktion, Bonusaktion oder Reaktion immer nur ein Geschoss aus einer Waffe mit der Eigenschaft Laden abfeuern, egal, wie viele Angriffe dir zur Verfügung stehen.",
        data: {
            mechanical_effect: "limit_one_shot_per_action"
        }
    },
    {
        id: "light",
        name: "Leicht",
        description: "Wenn du in deinem Zug die Angriffsaktion ausführst und mit einer leichten Waffe angreifst, kannst du später im selben Zug als Bonusaktion einen zusätzlichen Angriff ausführen. (Beachte: Einkerben Mastery kann dies ändern).",
        data: {
            mechanical_effect: "bonus_attack_eligible"
        }
    },
    {
        id: "range",
        name: "Reichweite",
        description: "Die Reichweite umfasst zwei Werte: Grundreichweite und Maximalreichweite. Bei Angriffen außerhalb der Grundreichweite bist du im Nachteil. Ziele außerhalb der Maximalreichweite können nicht angegriffen werden.",
        data: {
            mechanical_effect: "range_penalty_and_limit"
        }
    },
    {
        id: "heavy",
        name: "Schwer",
        description: "Du bist bei Angriffswürfen mit schweren Waffen im Nachteil, wenn du bei Nahkampfwaffen einen Stärkewert von weniger als 13 und bei Fernkampfwaffen einen Geschicklichkeitswert von weniger als 13 hast.",
        data: {
            mechanical_effect: "disadvantage_on_low_attr",
            min_attr: 13
        }
    },
    {
        id: "versatile",
        name: "Vielseitig",
        description: "Waffen mit der Eigenschaft Vielseitig können mit einer Hand oder mit zwei Händen geführt werden. Mit der Eigenschaft wird ein Schadenswert in Klammern genannt, der bei zweihändiger Führung gilt.",
        data: {
            mechanical_effect: "variable_damage"
        }
    },
    {
        id: "reach",
        name: "Weitreichend",
        description: "Bei Waffen mit der Eigenschaft Weitreichend ist die normale Angriffsreichweite um 1,5 Meter erhöht. Dies gilt auch bei Gelegenheitsangriffen.",
        data: {
            mechanical_effect: "reach_bonus",
            bonus_m: 1.5
        }
    },
    {
        id: "thrown",
        name: "Wurfwaffe",
        description: "Waffen mit der Eigenschaft Wurfwaffe können geworfen werden, um Fernkampfangriffe auszuführen. Sie können als Teil des Angriffs gezogen werden.",
        data: {
            mechanical_effect: "thrown_ranged_attack"
        }
    },
    {
        id: "two-handed",
        name: "Zweihändig",
        description: "Waffen mit der Eigenschaft Zweihändig müssen mit zwei Händen geführt werden.",
        data: {
            mechanical_effect: "requires_two_hands"
        }
    }
];

async function main() {
    await fs.writeFile('tools/intermediate_data/weapon_properties.json', JSON.stringify({ properties: PROPERTIES }, null, 2));
    console.log("Weapon properties extracted.");
}

main();






