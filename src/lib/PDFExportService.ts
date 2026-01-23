import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Character, Class, Species, Spell } from "./types";
import { calculateDerivedStats, SKILL_MAP } from "./characterLogic";
import { calculateModifier } from "./math";

export class PDFExportService {
  private doc: jsPDF;
  private character: Character;
  private characterClass?: Class;
  private characterSpecies?: Species;
  private spellCompendium: Spell[];
  private currentY: number = 20;
  private margin: number = 20;
  private pageWidth: number;

  constructor(
    character: Character,
    characterClass?: Class,
    characterSpecies?: Species,
    spellCompendium: Spell[] = [],
  ) {
    this.doc = new jsPDF();
    this.character = character;
    this.characterClass = characterClass;
    this.characterSpecies = characterSpecies;
    this.spellCompendium = spellCompendium;
    this.pageWidth = this.doc.internal.pageSize.getWidth();
  }

  public async generatePDF(): Promise<Uint8Array> {
    const stats = calculateDerivedStats(
      this.character,
      this.characterClass,
      this.characterSpecies,
    );

    this.addPage1(stats);
    this.doc.addPage();
    this.currentY = 20;
    this.addPage2(stats);

    return new Uint8Array(this.doc.output("arraybuffer"));
  }

  private addPage1(stats: any) {
    this.drawHeader();
    this.drawCombatStats(stats);
    this.drawAttributes();
    this.drawSavingThrows(stats);
    this.drawSkills(stats);
    this.drawWeapons(stats);
  }

  private addPage2(stats: any) {
    this.drawInventory(stats);
    this.drawFeaturesAndTraits();
    if (stats.spell_save_dc > 0 || this.character.spells?.length > 0) {
      this.drawSpellcasting(stats);
    }
  }

  private drawHeader() {
    this.doc.setFont("Helvetica", "bold");
    this.doc.setFontSize(24);
    this.doc.text(this.character.meta.name, this.margin, this.currentY);

    this.currentY += 8;
    this.doc.setFontSize(10);
    this.doc.setFont("Helvetica", "normal");
    const subheader = `${this.character.meta.species_id || "Unbekannt"} | ${this.character.meta.class_id || "Klasse"} (Stufe ${this.character.meta.level})`;
    this.doc.text(subheader, this.margin, this.currentY);

    this.currentY += 10;
    this.doc.setLineWidth(0.5);
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(
      this.margin,
      this.currentY,
      this.pageWidth - this.margin,
      this.currentY,
    );
    this.currentY += 15;
  }

  private drawCombatStats(stats: any) {
    this.doc.setFontSize(14);
    this.doc.text("Kampfwerte", this.margin, this.currentY);
    this.currentY += 8;

    const combatData = [
      { label: "RK", value: stats.ac },
      {
        label: "INIT",
        value:
          stats.initiative >= 0
            ? `+${stats.initiative}`
            : stats.initiative.toString(),
      },
      { label: "Ü-BONUS", value: `+${stats.proficiency_bonus}` },
      { label: "SPEED", value: `${stats.movement_speed}${stats.speed_unit}` },
      {
        label: "GRÖSSE",
        value: (this.characterSpecies?.data as any)?.size || "M",
      },
      { label: "PASSIV-W", value: stats.passive_perception },
    ];

    let startX = this.margin;
    combatData.forEach((item) => {
      this.doc.setFontSize(8);
      this.doc.text(item.label, startX, this.currentY);
      this.doc.setFontSize(11);
      this.doc.text(item.value.toString(), startX, this.currentY + 5);
      startX += 28; // Slightly tighter
    });

    this.currentY += 12;
    this.doc.setFontSize(8);
    this.doc.text(
      `Trefferpunkte: ${this.character.health.current}/${this.character.health.max}`,
      this.margin,
      this.currentY,
    );
    this.currentY += 8;
  }

  private drawAttributes() {
    this.doc.setFontSize(14);
    this.doc.text("Attribute", this.margin, this.currentY);
    this.currentY += 8;

    const attributes = [
      {
        label: "STR",
        score: this.character.attributes.str,
        mod: calculateModifier(this.character.attributes.str),
      },
      {
        label: "DEX",
        score: this.character.attributes.dex,
        mod: calculateModifier(this.character.attributes.dex),
      },
      {
        label: "CON",
        score: this.character.attributes.con,
        mod: calculateModifier(this.character.attributes.con),
      },
      {
        label: "INT",
        score: this.character.attributes.int,
        mod: calculateModifier(this.character.attributes.int),
      },
      {
        label: "WIS",
        score: this.character.attributes.wis,
        mod: calculateModifier(this.character.attributes.wis),
      },
      {
        label: "CHA",
        score: this.character.attributes.cha,
        mod: calculateModifier(this.character.attributes.cha),
      },
    ];

    let startX = this.margin;
    attributes.forEach((attr) => {
      this.doc.setFontSize(8);
      this.doc.text(attr.label, startX, this.currentY);
      this.doc.setFontSize(14);
      const modStr = attr.mod >= 0 ? `+${attr.mod}` : attr.mod.toString();
      this.doc.text(modStr, startX, this.currentY + 6);
      this.doc.setFontSize(7);
      this.doc.text(`(${attr.score})`, startX, this.currentY + 10);
      startX += 30;
    });

    this.currentY += 20;
  }

  private drawSavingThrows(stats: any) {
    this.doc.setFontSize(14);
    this.doc.text("Rettungswürfe", this.margin, this.currentY);
    this.currentY += 5;

    const saveLabels: Record<string, string> = {
      str: "STR",
      dex: "DEX",
      con: "CON",
      int: "INT",
      wis: "WIS",
      cha: "CHA",
    };

    const saveData = Object.entries(stats.saving_throws).map(
      ([attr, bonus]: [any, any]) => {
        const isProf = this.character.proficiencies?.saving_throws?.includes(
          attr,
        )
          ? "X"
          : "";
        const bonusStr = bonus >= 0 ? `+${bonus}` : bonus.toString();
        return [isProf, saveLabels[attr] || attr.toUpperCase(), bonusStr];
      },
    );

    autoTable(this.doc, {
      startY: this.currentY,
      margin: { left: this.margin },
      tableWidth: (this.pageWidth - this.margin * 2) / 2, // Half width
      head: [["Ü", "Attr", "Bonus"]],
      body: saveData,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 1 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        2: { halign: "right" },
      },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
  }

  private drawSkills(stats: any) {
    this.doc.setFontSize(14);
    this.doc.text("Fertigkeiten", this.margin, this.currentY);
    this.currentY += 5;

    const skillData = Object.entries(SKILL_MAP).map(([name, attr]) => {
      const bonus = stats.skills[name];
      const bonusStr = bonus >= 0 ? `+${bonus}` : bonus.toString();
      const isProf = this.character.proficiencies?.skills?.includes(name)
        ? "X"
        : "";
      return [isProf, name, `(${attr})`, bonusStr];
    });

    autoTable(this.doc, {
      startY: this.currentY,
      margin: { left: this.margin },
      tableWidth: this.pageWidth - this.margin * 2,
      head: [["Ü", "Fertigkeit", "Attr", "Bonus"]],
      body: skillData,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 1 },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        3: { halign: "right" },
      },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
  }

  private drawWeapons(stats: any) {
    if (!stats.weapon_attacks || stats.weapon_attacks.length === 0) return;

    this.doc.setFontSize(14);
    this.doc.text("Waffen & Angriffe", this.margin, this.currentY);
    this.currentY += 5;

    const weaponData = stats.weapon_attacks.map((w: any) => [
      w.name,
      w.attack_bonus >= 0 ? `+${w.attack_bonus}` : w.attack_bonus.toString(),
      w.damage,
      w.properties.join(", "),
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      margin: { left: this.margin },
      tableWidth: this.pageWidth - this.margin * 2,
      head: [["Waffe", "Bonus", "Schaden", "Eigenschaften"]],
      body: weaponData,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
  }

  private drawInventory(stats: any) {
    this.doc.setFontSize(14);
    this.doc.text("Ausrüstung & Inventar", this.margin, this.currentY);

    // Coins from meta
    this.doc.setFontSize(9);
    const cp = this.character.meta.currency_copper || 0;
    const sp = this.character.meta.currency_silver || 0;
    const ep = this.character.meta.currency_electrum || 0;
    const gp = this.character.meta.currency_gold || 0;
    const pp = this.character.meta.currency_platinum || 0;
    const coinStr = `KM: ${cp} | SM: ${sp} | EM: ${ep} | GM: ${gp} | PM: ${pp}`;
    this.doc.text(
      coinStr,
      this.pageWidth - this.margin - this.doc.getTextWidth(coinStr),
      this.currentY,
    );

    this.currentY += 5;

    // Group by location
    const locations = [
      { id: "Body", label: "Am Körper" },
      { id: "Backpack", label: "Im Rucksack" },
      { id: "Mount", label: "Reittier & Lager" },
      { id: "MagicContainer", label: "Magische Behälter" },
    ];

    locations.forEach((loc) => {
      if (this.currentY > 250) {
        this.doc.addPage();
        this.currentY = 20;
      }

      const items = this.character.inventory.filter(
        (i) => (i.location || "Body") === loc.id,
      );
      const data = items.map((item) => [
        item.quantity,
        item.custom_name || item.item_id, // Would need name resolution ideally
        item.is_equipped ? "Ja" : "Nein",
        // Weight would need resolution too, simplified for now
        "-",
      ]);

      // Add empty rows
      for (let i = 0; i < 3; i++) {
        data.push(["", "", "", ""]);
      }

      this.doc.setFontSize(10);
      this.doc.setFont("Helvetica", "bold");
      this.doc.text(loc.label, this.margin, this.currentY + 5);
      this.currentY += 7;

      autoTable(this.doc, {
        startY: this.currentY,
        margin: { left: this.margin },
        tableWidth: this.pageWidth - this.margin * 2,
        head: [["Menge", "Gegenstand", "Getragen", "Gewicht (kg)"]],
        body: data,
        theme: "striped",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
        columnStyles: {
          0: { cellWidth: 15, halign: "center" },
          2: { cellWidth: 15, halign: "center" },
          3: { cellWidth: 20, halign: "right" },
        },
      });

      this.currentY = (this.doc as any).lastAutoTable.finalY + 5;
    });

    this.doc.setFontSize(9);
    this.doc.setFont("Helvetica", "normal");
    const weightStr = `Gesamtgewicht: ${stats.encumbrance.current.toFixed(1)} kg / Tragkraft: ${stats.encumbrance.max.toFixed(1)} kg`;
    this.doc.text(weightStr, this.margin, this.currentY + 5);
    this.currentY += 15;
  }

  private drawSpellcasting(stats: any) {
    this.doc.setFontSize(14);
    this.doc.text("Zauberwirken", this.margin, this.currentY);

    this.doc.setFontSize(9);
    const spellInfo = `SG: ${stats.spell_save_dc} | Angriff: +${stats.spell_attack_bonus}`;
    this.doc.text(
      spellInfo,
      this.pageWidth - this.margin - this.doc.getTextWidth(spellInfo),
      this.currentY,
    );

    this.currentY += 5;

    // Spell Slots from meta
    const meta = this.character.meta;
    const slots = [
      `G1: ${(meta.spell_slots_1 || 0) - (meta.spell_slots_used_1 || 0)}/${meta.spell_slots_1 || 0}`,
      `G2: ${(meta.spell_slots_2 || 0) - (meta.spell_slots_used_2 || 0)}/${meta.spell_slots_2 || 0}`,
      `G3: ${(meta.spell_slots_3 || 0) - (meta.spell_slots_used_3 || 0)}/${meta.spell_slots_3 || 0}`,
    ];
    this.doc.setFontSize(8);
    this.doc.text(slots.join("  |  "), this.margin, this.currentY + 3);
    this.currentY += 8;

    if (this.character.spells && this.character.spells.length > 0) {
      const spellData = this.character.spells.map((s) => {
        const details = this.spellCompendium.find((sp) => sp.id === s.spell_id);
        return [
          details ? (details.level === 0 ? "Trick" : `G${details.level}`) : "?",
          details?.name || s.spell_id,
          s.is_prepared ? "Ja" : "Nein",
        ];
      });

      autoTable(this.doc, {
        startY: this.currentY,
        margin: { left: this.margin },
        tableWidth: this.pageWidth - this.margin * 2,
        head: [["Grad", "Zauber", "Vorb."]],
        body: spellData,
        theme: "striped",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
      });

      this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
    } else {
      this.currentY += 10;
    }
  }

  private drawFeaturesAndTraits() {
    this.doc.setFontSize(14);
    this.doc.text("Merkmale & Talente", this.margin, this.currentY);
    this.currentY += 5;

    const featData = this.character.feats.map((f) => [
      f,
      "Details siehe Sheet",
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      margin: { left: this.margin },
      tableWidth: this.pageWidth - this.margin * 2,
      head: [["Merkmal", "Beschreibung"]],
      body: featData,
      theme: "plain",
      styles: { fontSize: 8 },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
  }
}
