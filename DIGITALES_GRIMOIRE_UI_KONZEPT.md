# D&D Nexus – UI Konzepte (Digitales Grimoire + Fluid UI)

Diese Datei sammelt zwei zusammengehörige Konzepte, damit wir sie für das UI-Redesign nicht verlieren:

1. **Digitales Grimoire** (Visuelle Identität, Typografie, Farbsystem, Komponenten-Stil)
2. **Fluid UI / Auto-Flow** (technisches Layout-Konzept: Grid/Flex-Wrap statt fixer Breiten)

---

## 1) Digitales Grimoire – Visuelle Identität & Branding

### 1.1 Banner („Zweigespaltenes Schicksal“)
- **Stil**: Horizontaler Verlauf von tiefem Nacht-Blau/Schwarz (Dark) zu warmem Pergament-Gold (Light).
- **Zentrum**: Heraldik-Logo:
  - W20-Würfel, Umrisse als goldene Runen
  - dahinter zwei gekreuzte Federn (Charakter-Generierung/Schreiben)
- **Schriftzug**: „D&D NEXUS“ mittig, **Cinzel Decorative**.

### 1.2 Favicon
- Minimalistischer W20-Umriss in Gold `#B8934E`
- Innen: „20“ oder „N“ (gotischer Stil)

---

## 2) Typografie (kostenlose Google Fonts)

Drei-Schriften-Strategie (Struktur vs. Atmosphäre):

- **Überschriften**: *Cinzel Decorative* (heroisch/episch)
- **Fließtext**: *EB Garamond* (klassisch/buchartig, sehr gut lesbar)
- **Zahlen/Werte**: *Grenze Gotisch* (kompakt, „mittelalterlich“, ideal für Stats)

### 2.1 Setup (HTML)

Include in `index.html` (Head):

```html
<link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=EB+Garamond:wght@400;600&family=Grenze+Gotisch:wght@600&display=swap" rel="stylesheet">
```

---

## 3) Farb-System (CSS Tokens)

Ziel: harte Kontraste vermeiden, aber klarer Fokus + konsistentes Gold-Akzent-System.

### 3.1 Dark Design („Shadow“)

```css
--bg: 220 25% 8%;             /* #0A0C10 - fast schwarz */
--surface: 220 20% 13%;       /* #161A1F - tiefer schiefer */
--card: 220 20% 16%;          /* #1F242B */
--text: 38 36% 96%;           /* #F8F5F0 - pergament-weiß */
--accent: 39 43% 51%;         /* #B8934E - gold */
--border: 220 15% 25%;
--primary: 39 43% 51%;
--primary-foreground: 220 25% 8%;
```

### 3.2 Light Design („Parchment“)

```css
--bg: 38 36% 96%;             /* #F8F5F0 - antikes papier */
--surface: 41 33% 91%;        /* #EFEADF - dunkleres pergament */
--card: 41 33% 88%;           /* #EAE4D6 */
--text: 217 33% 15%;          /* #1A222E - fast schwarz */
--accent: 39 43% 51%;         /* #B8934E - gold */
--border: 37 20% 80%;
--primary: 39 43% 45%;        /* etwas dunkleres gold für lesbarkeit */
--primary-foreground: 38 36% 96%;
```

---

## 4) UI-Komponenten & Layout-Stil

### 4.1 Buttons („Forged“)
- **Form**: „geclippt“ (8-eckige Anmutung)
- **Rahmen**: `2px solid var(--accent)`
- **Hover**: Gold füllt von links → rechts, Textfarbe invertiert

### 4.2 Karten („Character Cards“)
- **Light**: warmer weicher Schatten statt harter Rahmen  
  `box-shadow: 0 4px 20px rgba(50, 30, 0, 0.1)`
- **Dark**: 1px Gold-Akzent nur oben (wie Dokument in Mappe)

### 4.3 Navigation
- Schmale Top-Bar, semi-transparent, mit Blur (`backdrop-filter: blur(10px)`)
- Beim Scrollen schimmert Content subtil durch („Magie“-Effekt)

---

## 5) Frontend Styleguide – Prinzipien (Kurz)

1. **Parchment Depth**: subtile Textur/Grain auf Hintergründen (optional).
2. **Golden Thread**: Gold-Akzent für interaktive Icons/Highlights.
3. **Heroic Headers**: Page Titles immer *Cinzel Decorative*.

Elemente:
- **Inputs**: bottom-border only (wie Signaturzeile auf Schriftrolle)
- **Progress Bars**: Gold-Gradient + leichter Glow
- **Modals**: zentriert, ornate border oben/unten (oder „thick top/bottom“)

---

# 2) Fluid UI Concept – Auto-Flow Layout (technisch)

## 1) Auto-Flow Prinzip

Statt Containern zu sagen „du bist 400px breit“, sagen wir:
„Nimm dir den Platz, den du brauchst – und rücke bei Engpässen um.“

Kern: **CSS Grid + Flex-Wrap** statt fixer Widths/Höhen.

---

## 2) Layout-Strategie

### 2.1 Header (Charakter-Info)
- `flex-wrap` nutzen
- Jede Info als eigene „Tile“ (Label + Value) kapseln
- Tiles: `flex-1` + `min-w-[150px]` (oder `min-w-[120px]` für sehr kleine Einheiten)

### 2.2 Haupt-Dashboard (Responsive Grid)

Ziel-Layout:
- **Breit**: 3 Spalten (Attribute | Kampfwerte | Persönlichkeit)
- **Mittel**: 2 Spalten (Kampfwerte links groß, Attribute + Persönlichkeit rechts/unten)
- **Schmal**: 1 Spalte (alles untereinander)

Beispiel:

```html
<div class="w-full max-w-[1400px] mx-auto">
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <section class="lg:col-span-1">...</section>
    <section class="md:col-span-2 lg:col-span-1">...</section>
    <section class="md:col-span-1 lg:col-span-1">...</section>
  </div>
</div>
```

---

## 3) Tailwind Struktur-Optimierung

### 3.1 Container
- `w-full max-w-[1400px] mx-auto` statt Full-Bleed Layout überall

### 3.2 Grid statt fixer Breiten
- Ersetzen von `w-[450px]`/fixen Panels → `grid-cols-*` + `col-span-*`
- Einheitliche Abstände: `gap-4`/`gap-6` statt adhoc Margins

---

## 4) Typografie-/Layout-Fixes (gegen „Grausige Schriften“)

Typische Ursachen:
- `white-space: nowrap`
- fixe Höhen, die Text nicht aufnehmen

Gegenmaßnahmen:
- **Flexible Textgrößen**: `text-base xl:text-lg`
- **Clamp** für besonders kritische Titel: `font-size: clamp(1rem, 2vw, 1.5rem);`
- **Truncation**: `truncate` für lange Namen
- **Inputs**: `w-full` in Container mit `min-w-[120px]`
- **HP-Box**: bei schmaler Breite auf `flex-col` wechseln, damit Werte nicht überlappen
- **Cards**: `h-fit` statt fixer Höhen

---

## 5) UI-Logic / Responsives Verhalten

- Unter `lg` (< 1024px): Sidebar ggf. zu Bottom-Bar oder Hamburger
- Tabs/Buttons („Kampf“, „Zauber“ …):
  - **nicht schrumpfen**, sondern umbrechen
  - Grid-Ansatz: `grid-cols-2` (small) → `grid-cols-4` (large)
  - optional `auto-fit` via CSS Grid Template Columns

---

## 6) Notion-kompatibler Refactor-Plan (Kurz)

**Grid System (Tailwind)**
- Fixed widths → responsive grid spans
- `gap-4`/`gap-6` konsistent

**Component Breakpoints**
- Header: `flex-wrap`, Tiles: `flex-1 min-w-[150px]`
- Action Buttons: `grid-cols-2` small, `grid-cols-4` large

**Typography Fixes**
- `truncate` für lange Namen
- `clamp()` für fluid sizes

**UI-Logic**
- Sidebar collapse < 1024px
- `h-fit` statt Fixhöhen

---

## Verknüpfung zur Checklist

Siehe `CHECKLIST.md` → **P2 — UI/UX Layout & Visual Design ("Digitales Grimoire")**.

