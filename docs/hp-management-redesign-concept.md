# HP Management Redesign - Konzept

## Problem-Analyse
- **Überlappende Texte**: "147" und "183" überlappen sich
- **Zu viele separate Karten**: 3 große Karten nebeneinander = zu eng
- **Schlechte Lesbarkeit**: Labels werden abgeschnitten ("TP-BER", "TODESRETTUI")
- **Unübersichtlich**: Zu viele Informationen auf einmal

## Neues Design-Konzept

### Struktur: **Eine Card mit klarer Hierarchie**

```
┌─────────────────────────────────────────────────┐
│  ❤️ TREFFERPUNKTE                               │
├─────────────────────────────────────────────────┤
│                                                 │
│        [147]  /  [183]  TP                      │
│        ━━━━━━━━━━━━━━━━━━━━━━━━                │
│         [─── 80% ───]                           │
│                                                 │
│  [Durchschnitt]  [Temp: 0]                     │
├─────────────────────────────────────────────────┤
│  🎲 W8 × 0 / 18    [±]   │   ☑☑☐  ☒☒☐         │
│     Hit Dice       │   Erfolge  Fehlschläge   │
└─────────────────────────────────────────────────┘
```

### Design-Prinzipien:

1. **Hauptfokus: HP-Zahlen**
   - Große, prominente Zahlen: `147 / 183`
   - Visueller Slider zur schnellen Übersicht
   - Temp HP optional klein unten

2. **Sekundär: Hit Dice & Death Saves**
   - Kompakt nebeneinander in einer Zeile
   - Kleine, aber lesbare Icons/Buttons
   - Keine großen separaten Karten

3. **Kompakt & Lesbar**
   - Eine Card statt drei
   - Klare visuelle Hierarchie
   - Max. 2 Zeilen für sekundäre Infos

### Responsive Strategie:

- **Mobile (< 640px)**: Alles gestapelt, Slider kleiner
- **Tablet (640-1279px)**: HP groß oben, Hit Dice & Death Saves untereinander
- **Desktop (≥ 1280px)**: HP oben groß, Hit Dice & Death Saves nebeneinander unten

## Implementation

### Layout-Struktur:
```jsx
<div className="bg-card p-4 rounded-lg border border-border">
  {/* Titel */}
  <h3>TREFFERPUNKTE</h3>
  
  {/* Hauptbereich: HP Anzeige */}
  <div className="mb-4">
    {/* Große Zahlen: 147 / 183 */}
    {/* Slider */}
    {/* Temp HP & Berechnung */}
  </div>
  
  {/* Sekundärbereich: Hit Dice & Death Saves */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t">
    {/* Hit Dice */}
    {/* Death Saves */}
  </div>
</div>
```

### Vorteile:
✅ **Eine Card** = keine Überlappungen
✅ **Klarer Fokus** auf wichtigste Info (HP)
✅ **Kompakt** = weniger Platzbedarf
✅ **Lesbar** = große Zahlen, klare Labels
✅ **Responsive** = funktioniert auf allen Größen
