# ⚔️ Status: Combat Property-Effekte

## ✅ Implementiert

### Mechanisch (in Berechnung integriert)
- **Finesse**: Höherer Wert aus STR/DEX für Angriff und Schaden
- **Ranged (Fernkampf)**: Verwendet DEX statt STR
- **Versatile**: 2H-Toggle zeigt vielseitigen Schaden (1d8 statt 1d6)
- **Offhand (Nebenhand)**: Attributsmodifikator = 0 (außer mit TWF-Kampfstil)
- **Two-Weapon Fighting (TWF)**: Kampfstil-Integration, Attributsmodifikator bei Nebenhand

### Anzeige/Info (Labels)
- **Thrown (Wurfwaffen)**: Range-Label "Wurf X/Y" wird angezeigt
- **Range (Fernkampf)**: Range-Label "Reichweite X/Y" wird angezeigt
- **Properties**: Alle Properties werden in der UI angezeigt (dedupliziert)

### Attribut-Logik
- **Nahkampf**: STR (Standard)
- **Fernkampf (ammunition)**: DEX
- **Wurfwaffen (thrown)**: STR (wie Nahkampf) ✅ Korrekt!
- **Finesse**: Max(STR, DEX)

---

## 📋 Offen (P2 - UI-Hinweise & Info)

### Heavy-Property
**Regel:** Nachteil bei Angriffswürfen wenn STR < 13 (Nahkampf) oder DEX < 13 (Fernkampf)

**Implementierung:**
- UI-Hinweis/Warnung in WeaponsTable anzeigen
- Tooltip: "Heavy: Nachteil bei Angriffswürfen wenn STR/DEX < 13"

### Reach-Property
**Regel:** +1.5m Reichweite bei Nahkampfangriffen

**Implementierung:**
- UI-Hinweis in Properties anzeigen
- Tooltip: "Reach: +1.5m Reichweite bei Nahkampfangriffen"

### Ammunition-Property
**Regel:** Geschosse werden verbraucht, Nach Kampf 50% zurückgewinnen

**Status:** Nur Info, keine mechanische Berechnung nötig
- Wird bereits als Property angezeigt
- Beschreibung ist in DB vorhanden

### Loading-Property
**Regel:** Nur 1 Geschoss pro Zug (auch mit Extra Attack)

**Status:** Nur Info, keine mechanische Berechnung nötig
- Wird bereits als Property angezeigt
- Beschreibung ist in DB vorhanden

---

## 🔍 Verifikation

### Wurfwaffen-Range ✅
- [x] `getWeaponRangeLabels` zeigt "Wurf X/Y" für `thrown_range`
- [x] Wurfwaffen verwenden STR (wie Nahkampf) - `isWeaponRanged` prüft nur auf `ammunition`
- [x] Range-Labels werden in Properties-Array angezeigt

### Weitere Property-Effekte
- [x] Finesse: Max(STR, DEX) ✅
- [x] Versatile: 2H-Schaden angezeigt ✅
- [x] Offhand: Attributsmodifikator = 0 (außer TWF) ✅
- [ ] Heavy: UI-Hinweis bei STR/DEX < 13
- [ ] Reach: UI-Hinweis +1.5m Reichweite

---

## 📝 Nächste Schritte (Priorität)

1. **Heavy-Property UI-Hinweis** (Quick-Win)
   - In WeaponsTable: Warnung anzeigen wenn Waffe Heavy hat und STR/DEX < 13
   
2. **Reach-Property UI-Hinweis** (Quick-Win)
   - In Properties-Anzeige: "Reach (+1.5m)" ergänzen

3. **Formelsammlung aktualisieren**
   - Wurfwaffen-Rule dokumentieren
   - Heavy/Reach-Regeln ergänzen