# Design-Schema (D&D Nexus Sheet Engine)

Dieses Dokument beschreibt das aktuelle Design-/Theme-Schema im Projekt: Token-Architektur, Theme-Umschaltung, `color-scheme`, Tailwind-Mapping, Typografie, Effekte und Motion.

## 1) Architektur-Prinzip: Token-first + Theme via Root-Class
- **Single Source of Truth**: Design-Tokens sind CSS-Variablen in `src/index.css`.
- **Theme-Switch**: Theme ist eine Klasse auf `<html>` (`light`/`dark`). Komponenten rendern nur Tokens (via Tailwind), nicht „Dark/Light-Logik“.
- **Persistenz**: Theme-State ist über zustand `persist` gespeichert (Default: `light`).

## 2) Farb-Schema (Tokens): Semantik & Struktur
### 2.1 Token-Satz (Light/Dark: gleiche Namen, andere Werte)
In `src/index.css` existiert ein stabiler Token-Satz, der pro Theme andere HSL-Werte erhält.

**Core UI-Tokens**
- `--background`, `--foreground`: App-Background & Standard-Text
- `--card`, `--card-foreground`: Panel/Card-Flächen & Text
- `--muted`, `--muted-foreground`: Secondary-Flächen & de-emphasized Text
- `--border`: Standard-Linien/Separatoren
- `--primary`, `--primary-foreground`: Primär-Interaktionen/Highlights
- `--accent`, `--accent-foreground`: Brand/Magie-Akzent
- `--ring`: Focus-Ring/Fokus-Indikator
- `--destructive`, `--destructive-foreground`: Danger/Errors

**Zusatz-/Layout-Tokens**
- `--bg`, `--surface`, `--text`: zusätzliche/„Design“-Tokens (z.B. Glassmorphism/Logo), parallel zu `background/foreground`.

**Form**
- `--radius`: Basis-Radius für Tailwind-Radien.

### 2.2 Warum HSL
- Theme-Varianten lassen sich konsistenter über Lightness/Saturation steuern.
- Alpha kann sauber als HSL-Alpha angegeben werden (`... / 0.6`).
- Tailwind kann per `<alpha-value>` konsistente Transparenzen aus Utilities erzeugen.

### 2.3 „Legacy compatibility“
`--background/--foreground/...` spiegeln das Schema und sichern Kompatibilität zu bestehenden Tailwind-Namings. Gleichzeitig existieren `--bg/--surface/--text` als zusätzliche Primitives.

## 3) Theme-Mechanik (Light/Dark): technisch
### 3.1 Umschaltung
Die App setzt die Klasse `light` oder `dark` auf das Root-Element (`document.documentElement`).

```ts
useEffect(() => {
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
}, [theme]);
```

### 3.2 Persistenz / Default
Theme ist in zustand persistiert. Default ist `light`.

## 4) `color-scheme`: System-Integration
Im CSS ist `color-scheme` für Dark Mode gesetzt:
- `color-scheme: dark` in `.dark`

**Effekt**
- Native Controls (je nach Plattform/Browser: Form-Controls, Autofill, Scrollbar-Native-Parts) wirken im Dark Mode konsistenter.
- Für Light Mode ist kein explizites `color-scheme: light` gesetzt → Standardverhalten (typisch: light).

## 5) Tailwind als Token-Renderer (Mapping)
Tailwind mappt Colors auf `hsl(var(--token) / <alpha-value>)`. Dadurch sind Utilities theme-fähig, ohne Hardcoding.

Beispiele:
- `bg-background` → `hsl(var(--background) / <alpha-value>)`
- `text-foreground` → `hsl(var(--foreground) / <alpha-value>)`
- `border-border` → `hsl(var(--border) / <alpha-value>)`
- `bg-card`, `text-card-foreground`
- `bg-muted`, `text-muted-foreground`
- `bg-primary`, `text-primary-foreground`
- `ring`/`focus:ring-*` → `--ring` bzw. `--primary`-basierte Ringe

### 5.1 Alpha-Tokens: Schema-Regel (wichtig)
Einige Tokens enthalten bereits Alpha im Token (z.B. `--muted-foreground: ... / 60%`, `--input: ... / 0.1`).
Da Tailwind zusätzlich `<alpha-value>` anfügen kann, ist als langfristige Design-System-Regel sinnvoll:
- **Alpha entweder im Token ODER in der Utility (Tailwind), nicht doppelt.**

Im aktuellen Code werden `secondary/input`-Utilities praktisch nicht genutzt; daher fällt ein potentieller Double-Alpha-Fall nicht auf.

### 5.2 Tailwind-Detail
In der Tailwind-Config ist `accent` doppelt deklariert (als String und später als Objekt). Effektiv gilt der zuletzt definierte Key (Objekt). Funktional ok, aber als Schema „unaufgeräumt“.

## 6) Globale Baselines (CSS): was überall wirkt
### 6.1 Body-Default + Theme-Transition
- `body` setzt `background-color` und `color` aus Tokens.
- Transition (0.4s) für einen „smooth“ Theme-Wechsel.

### 6.2 Border-Default
`* { border-color: hsl(var(--border)); }`
- Reduziert „vergessene“ Border-Farben, sobald Border-Widths gesetzt werden.

### 6.3 Select/Option Styling
`select` und `option` sind explizit theme-fähig (Card-Fläche + Card-Foreground).

## 7) Typografie-Schema
### 7.1 Font-Quelle
Fonts sind in `index.html` via Google Fonts eingebunden:
- Inter (UI)
- Cinzel / Playfair Display (Display/Serif)

### 7.2 Rollen & Konventionen
- **UI Text**: `Inter` (`font-sans`)
- **Headlines/Display**: Serif-Stack (`font-serif` / `font-display`), häufig `font-black`, `tracking-tighter`, teils `italic`
- **Global**: `h1..h6` bekommen Serif-Stack und `letter-spacing: -0.02em`

## 8) Shapes & Komponenten-Sprache (Radius, Cards, Borders)
### 8.1 Radius
- Token: `--radius: 1rem`
- Tailwind: `rounded-lg/md/sm` aus Token abgeleitet
- Im UI werden zusätzlich oft große, explizite Radien verwendet (`rounded-2xl`, `rounded-[2.5rem]`, `rounded-[3rem]`) → „weiches“, card-lastiges Look&Feel.

### 8.2 Borders/Hierarchy
- Standard: `border-border`
- Interaktion: Hover/Active setzt oft `border-primary/...` oder `text-primary`.

## 9) Effekte / Look & Feel (Glassmorphism, Glow, Scrollbar)
### 9.1 Glassmorphism (Primitives)
Es existieren definierte Klassen:
- `.glass`
- `.glass-panel`

Eigenschaften:
- `surface` mit Alpha
- `backdrop-filter: blur(12px)`
- Border via `--border`
- Shadow: im Dark Mode stärker (mehr Tiefe).

### 9.2 Glow (Dark Mode)
`icon-glow` ist bewusst nur im Dark Mode aktiv (`drop-shadow` mit `--accent`) – dort lesbarer als im Light Mode.

### 9.3 Custom Scrollbar
`custom-scrollbar` nutzt Thumb-Farbe aus `--muted-foreground` (mit niedriger Alpha) → dezent, aber sichtbar.

## 10) Motion / Interaction Patterns
### 10.1 Global
- Theme-Wechsel wird über Body-Transitions spürbar „polished“.

### 10.2 Komponenten-Konventionen
Häufige Patterns:
- `transition-all` / `transition-colors`
- `duration-300..700` (teils länger für Deko-Elemente)
- Micro-Interactions: `hover:scale-*`, `active:scale-*`

### 10.3 Animation
- `.animate-reveal`: Fade-in + `translateY` für Panels/Sections.

## 11) „Real usage“: dominierende Token-Utilities im UI
In Screens/Komponenten dominieren:
- `bg-background`, `text-foreground`
- `bg-card/80`, `bg-muted/20..50`
- `border-border`
- `bg-primary`, `text-primary`, `focus:ring-primary/...`

`secondary/input`-Utilities sind derzeit faktisch nicht verbreitet.

## 12) Hinweise / potentielle Verbesserungshebel (Schema-Qualität)
- **Explizites Light-`color-scheme`**: optional `color-scheme: light` für `.light`, wenn ihr maximale Deterministik wollt.
- **Alpha-Regel**: Alpha-Definition vereinheitlichen (Token vs Utility).
- **Tailwind-Config aufräumen**: doppelte `accent`-Definition entfernen, um das Schema eindeutiger zu machen.

