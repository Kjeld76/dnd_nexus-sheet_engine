# Verbesserungen für Hintergrund-Extraktion

## Aktuelle Probleme

1. **"Unbekannt" Hintergründe**: Namen sind in Grafiken eingebettet, daher nicht als Text erkennbar
2. **Duplikate**: Einige Hintergründe werden mehrfach erkannt
3. **Zweispaltige Anordnung**: Text kann auseinandergerissen sein
4. **Kontext-Erkennung**: Hintergrund-Namen werden nicht immer korrekt aus dem Kontext erkannt

## Empfohlene Verbesserungen

### 1. Lookup-Tabelle für Hintergrund-Identifikation (Höchste Priorität)

**Problem**: Namen sind in Grafiken, daher nicht direkt erkennbar.

**Lösung**: Erstelle eine Lookup-Tabelle basierend auf eindeutigen Kombinationen:
- Attributswerte (3 Werte)
- Talent (Feat-Name)
- Erste Fertigkeit

**Implementierung**:
```typescript
const backgroundLookup: Record<string, string> = {
  // Key: "Attribut1,Attribut2,Attribut3|Talent|ErsteFertigkeit"
  "Stärke,Intelligenz,Charisma|Begabt|Geschichte": "Adeliger",
  "Intelligenz,Weisheit,Charisma|Eingeweihter der Magie|Motiv erkennen": "Akolyth",
  "Stärke,Konstitution,Weisheit|Zäh|Mit Tieren umgehen": "Bauer",
  "Geschicklichkeit,Konstitution,Intelligenz|Wachsam|Fingerfertigkeit": "Krimineller",
  "Stärke,Geschicklichkeit,Intelligenz|Handwerker|Nachforschungen": "Handwerker",
  // ... weitere
};
```

**Vorteil**: 
- Funktioniert auch ohne sichtbare Namen
- Sehr zuverlässig (eindeutige Kombinationen)
- Einfach zu erweitern

### 2. Duplikat-Erkennung und -Bereinigung

**Problem**: Hintergründe werden mehrfach erkannt (z.B. "ADELIGER" 2x, "HÄNDLER" 3x).

**Lösung**: Post-Processing-Schritt:
1. Gruppiere nach eindeutigen Merkmalen (Attributswerte + Talent)
2. Behalte nur den vollständigsten Eintrag
3. Merge Daten, falls nötig

**Implementierung**:
```typescript
function deduplicateBackgrounds(backgrounds: Background[]): Background[] {
  const seen = new Map<string, Background>();
  
  for (const bg of backgrounds) {
    const key = [
      bg.ability_scores?.sort().join(','),
      bg.feat,
      bg.skills?.[0]
    ].filter(Boolean).join('|');
    
    const existing = seen.get(key);
    if (!existing || isMoreComplete(bg, existing)) {
      seen.set(key, bg);
    }
  }
  
  return Array.from(seen.values());
}
```

### 3. Verbesserte Kontext-Erkennung

**Problem**: Namen werden nicht aus dem Kontext erkannt.

**Lösung**: 
- Erweitere Suche auf mehr Zeilen vor "Attributswerte:"
- Suche nach bekannten Hintergrund-Namen in einem größeren Fenster (20-30 Zeilen)
- Nutze Seitenzahlen als Marker (Hintergründe sind auf Seiten 178-185)

**Implementierung**:
```typescript
// Suche in größerem Fenster
for (let j = Math.max(0, i - 30); j < i; j++) {
  const checkLine = lines[j].toUpperCase().trim();
  // ... Suche nach Hintergrund-Namen
}

// Nutze Seitenzahlen
if (line.match(/^\d+\s*KAPITEL/)) {
  const pageNum = parseInt(line.match(/^(\d+)/)?.[1] || '0');
  if (pageNum >= 178 && pageNum <= 185) {
    // Wir sind im Hintergrund-Bereich
  }
}
```

### 4. Manuelle Korrektur-Tabelle

**Problem**: Einige Hintergründe werden trotzdem nicht erkannt.

**Lösung**: Erstelle eine manuelle Mapping-Tabelle für bekannte Fälle:
```typescript
const manualCorrections: Record<string, string> = {
  "Unbekannt_Stärke_Intelligenz_Charisma_Begabt": "Adeliger",
  "Unbekannt_Intelligenz_Weisheit_Charisma_Eingeweihter": "Akolyth",
  // ...
};
```

### 5. Validierung und Post-Processing

**Problem**: Daten können unvollständig oder fehlerhaft sein.

**Lösung**: Validierungsschritt nach Extraktion:
1. Prüfe, ob alle Pflichtfelder vorhanden sind
2. Validiere Item/Tool-Referenzen
3. Bereinige offensichtliche Fehler (z.B. "178 Skills")
4. Generiere Report mit Problemen

**Implementierung**: Bereits vorhanden in `validate-backgrounds.ts`, aber erweitern:
- Automatische Korrekturen für häufige Fehler
- Warnungen für fehlende Referenzen
- Vorschläge für manuelle Korrekturen

### 6. Zweispaltige Anordnung berücksichtigen

**Problem**: Text kann auseinandergerissen sein (zwei Hintergründe nebeneinander).

**Lösung**: 
- Erkenne Spaltenwechsel (plötzliche Änderung des Kontexts)
- Sammle Text über mehrere Zeilen, bis eindeutiger Marker kommt
- Nutze Struktur-Marker (Attributswerte, Talent, etc.) als Trennzeichen

### 7. Beschreibung besser erkennen

**Problem**: Beschreibung kann mit anderen Texten vermischt werden.

**Lösung**:
- Beschreibung beginnt NACH "Ausrüstung" und endet VOR nächstem "Attributswerte:"
- Filtere Seitennummern und Kapitel-Marker raus
- Erkenne Beschreibungsende anhand von Länge und Format

## Priorisierung

1. **Höchste Priorität**: Lookup-Tabelle (löst "Unbekannt"-Problem)
2. **Hoch**: Duplikat-Bereinigung
3. **Mittel**: Verbesserte Kontext-Erkennung
4. **Niedrig**: Manuelle Korrekturen (nur für Edge Cases)

## Implementierungs-Plan

### Phase 1: Lookup-Tabelle
1. Erstelle Lookup-Tabelle mit allen 16 Hintergründen
2. Integriere in Extraktions-Skript
3. Teste mit aktuellen Daten

### Phase 2: Duplikat-Bereinigung
1. Implementiere Deduplizierungs-Logik
2. Teste mit aktuellen Daten
3. Validiere, dass keine Daten verloren gehen

### Phase 3: Validierung & Reporting
1. Erweitere Validierungs-Skript
2. Generiere detaillierten Report
3. Implementiere automatische Korrekturen für häufige Fehler

## Erwartetes Ergebnis

Nach Implementierung:
- ✅ Alle 16 Hintergründe korrekt identifiziert (keine "Unbekannt")
- ✅ Keine Duplikate
- ✅ Alle Optionen A und B korrekt extrahiert
- ✅ Alle Item/Tool-Referenzen validiert
- ✅ Vollständige Beschreibungen
