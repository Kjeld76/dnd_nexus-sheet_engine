# Design-Schema (deutlich tiefgehend)

Dieses Dokument beschreibt das Design-/Theme-Schema im Projekt: Token-Architektur, Theme-Umschaltung, `color-scheme`, Tailwind-Mapping (inkl. Alpha-Mechanik), Baselines, Typografie, Effekte, Motion und reale Usage-Patterns.

## 1) Architektur-Prinzip: Token-first + Theme via Root-Class
- **Single Source of Truth**: Design-Tokens sind CSS-Variablen in `src/index.css`.
- **Theme-Switch**: Das Theme ist eine Klasse auf `<html>` (`light`/`dark`). Dadurch „schalten“ sich Token-Werte um, ohne dass Komponenten Theme-Logik kennen müssen.
- **Persistenz/Default**: Zustand liegt in zustand (`persist`), Default ist `light`.

Theme-Klasse wird in `src/main.tsx` gesetzt:

```ts
useEffect(() => {
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
}, [theme]);
```

Persistenz in `src/lib/themeStore.ts`:

```ts
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
    }),
    {
      name: 'nexus-theme-v4-final-light',
    }
  )
);
```

## 2) Farb-Schema: Tokens, Semantik, und „Warum HSL“
Ihr nutzt **HSL** für Tokens – typisch für Theme-Systeme, weil:
- Licht/Dunkel-Varianten konsistent über Lightness/Saturation steuerbar sind.
- Alpha sauber integrierbar ist (z.B. `... / 0.6`).

### 2.1 Token-Set (Light + Dark identische Namen, andere Werte)
Token-Namen bleiben stabil, Werte wechseln pro Theme (`:root/.light` vs `.dark`).

Auszug (vereinfachtes Schema, vollständige Werte stehen in `src/index.css`):

```css
:root,
.light {
  --bg: 38 36% 96%;
  --surface: 41 33% 91%;
  --accent: 39 43% 51%;
  --text: 217 33% 17%;
  --border: 37 22% 70%;

  --background: 38 36% 96%;
  --foreground: 217 33% 17%;
  --card: 41 33% 88%;
  --muted: 41 33% 82%;
  --muted-foreground: 217 33% 17% / 60%;
  --primary: 39 43% 51%;
  --primary-foreground: 38 36% 96%;
  --destructive: 0 84.2% 60.2%;
  --input: 37 22% 77% / 0.1;
  --ring: 39 43% 51%;
  --radius: 1rem;
}

.dark {
  --bg: 208 37% 7%;
  --surface: 209 32% 13%;
  --accent: 191 81% 62%;
  --text: 191 81% 95%;
  --border: 217 33% 25%;
  /* ... gleicher Token-Satz, andere Werte ... */
}
```

### 2.2 Semantik der wichtigsten Tokens (praktische Bedeutung)
- `--background` / `--foreground`: App-Hintergrund + Standard-Textfarbe
- `--card` / `--card-foreground`: Pane/Sheet-Flächen + Text
- `--muted` / `--muted-foreground`: sekundäre Flächen & „leiser“ Text (Hints/Meta)
- `--border`: Default-Linien/Trenner (Light: bewusst kontrastreicher)
- `--primary`: interaktive Wichtigkeit (Active Tabs, Highlights, Focus, Primär-CTA)
- `--accent`: Brand/Magie-Akzent (Light: Gold, Dark: Cyan-Glow)
- `--ring`: Fokus-/Ring-Farbe (auf Primary ausgerichtet)
- `--destructive`: Fehler/Danger

### 2.3 „Legacy compatibility“: doppelte Benennung
Es gibt `--bg/--surface/--text/--accent` und zusätzlich `--background/--foreground/...`.
Das wirkt wie ein Übergang:
- Komponenten nutzen überwiegend `background/foreground/card/muted/primary/...` (Tailwind-konform).
- `bg/surface/text` werden als zusätzliche Tokens für Layout/Primitives verwendet (z.B. Glassmorphism/Logo).

## 3) `color-scheme`: was ihr wirklich macht (und was das bewirkt)
Ihr setzt `color-scheme` **nur** im Dark-Theme:

```css
.dark {
  color-scheme: dark;
}
```

**Bedeutung**
- Browser rendert native UI (Form-Controls, Autofill, Scrollbar-Teile je nach Plattform) im Dark Mode passender.
- Im Light-Mode wird **kein** `color-scheme: light;` gesetzt → Standardverhalten (typisch: light).

**Implikation**
- Dark-Mode: bessere native Konsistenz.
- Light-Mode: „Default“ – passt, weil `:root` bereits Light-Tokens enthält.

## 4) Tailwind als „Token-Renderer“ (Mapping + Alpha-Mechanik)
Tailwind referenziert Tokens über:

`hsl(var(--token) / <alpha-value>)`

Auszug aus `tailwind.config.js`:

```js
colors: {
  background: "hsl(var(--background) / <alpha-value>)",
  foreground: "hsl(var(--foreground) / <alpha-value>)",
  primary: {
    DEFAULT: "hsl(var(--primary) / <alpha-value>)",
    foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
  },
  muted: {
    DEFAULT: "hsl(var(--muted) / <alpha-value>)",
    foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
  },
  border: "hsl(var(--border) / <alpha-value>)",
  ring: "hsl(var(--ring) / <alpha-value>)",
  input: "hsl(var(--input) / <alpha-value>)",
  secondary: {
    DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
    foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
  },
}
```

### 4.1 Detail: `accent` ist doppelt definiert
In `tailwind.config.js` ist `accent` zweimal vorhanden (einmal als String, später als Objekt). In JS gewinnt der **letzte** Key → effektiv ist nur das Objekt aktiv (`accent.DEFAULT`, `accent.foreground`). Funktioniert, ist aber „Schema-Noise“.

### 4.2 Alpha-Tokens: potenzieller Double-Alpha-Fall (aktuell praktisch harmlos)
Beispiele in `src/index.css`:
- `--input: ... / 0.1`
- `--secondary: ... / 0.1`
- `--muted-foreground: ... / 60%`

Wenn Tailwind dann zusätzlich `/<alpha-value>` anhängt, kann das theoretisch zu ungültigen CSS-Werten führen (Alpha „zweimal“).
Aktuell fällt es nicht auf, weil `bg-secondary`/`bg-input`/`text-secondary`-Utilities im UI praktisch nicht verwendet werden.

Schema-Regel für Stabilität:
- **Alpha im Token ODER Alpha in der Utility – nicht beides.**

## 5) Globale Baselines (Reset/Defaults), die das Schema prägen
### 5.1 Body-Farbe + Transitions
Theme-Wechsel wirkt „polished“, weil `body` Farben aus Tokens nutzt und transitioniert:

```css
body {
  background-color: hsl(var(--background)) !important;
  color: hsl(var(--foreground));
  transition:
    background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    color 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 5.2 Globaler Border-Default
```css
* {
  border-color: hsl(var(--border));
}
```

Effekt: Sobald irgendwo Border-Widths gesetzt sind, greift automatisch die Schema-Farbe (weniger „vergessene“ Borders).

### 5.3 Native Select-Controls „schema-fähig“
```css
select {
  color: hsl(var(--foreground));
  background-color: hsl(var(--card));
}

select option {
  background-color: hsl(var(--card));
  color: hsl(var(--card-foreground));
}
```

## 6) Look & Feel Patterns: Glassmorphism, Glow, Scrollbar
### 6.1 Glassmorphism als wiederverwendbares Muster
`.glass` / `.glass-panel` sind Design-Primitives: Surface + Blur + Border + Shadow.

```css
.glass-panel {
  background-color: hsl(var(--surface) / 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid hsl(var(--border));
  border-radius: 1rem;
  box-shadow:
    0 8px 32px 0 rgba(0, 0, 0, 0.15),
    0 2px 8px 0 rgba(0, 0, 0, 0.1);
}

.dark .glass-panel {
  box-shadow:
    0 8px 32px 0 rgba(0, 0, 0, 0.4),
    0 2px 8px 0 rgba(0, 0, 0, 0.2);
}
```

### 6.2 Dark-only Glow (Magie-Effekt)
`icon-glow` ist absichtlich nur im Dark-Mode aktiv (Glow ist dort lesbarer).

### 6.3 Scrollbar-Design
Scrollbar-Thumb basiert auf `muted-foreground` mit niedriger Alpha → dezent, aber sichtbar.

## 7) Typografie: technische Quelle + Anwendungs-Konvention
### 7.1 Font-Quelle
Fonts werden in `index.html` geladen (Google Fonts):
- Cinzel
- Playfair Display
- Inter

### 7.2 Typo-Rollen
- Headlines: Serif-Stack (Cinzel/Playfair/Merriweather) via globalem `h1..h6`-Rule
- UI-Text: Inter via Tailwind `font-sans`
- Branding/Logo: nutzt Tokens (`--surface`, `--border`, `--accent`) direkt im SVG (`NexusLogo`) → automatisch theme-fähig

## 8) „Real usage“: welche Tokens dominieren im UI
Aus dem Komponenten-Code (z.B. `Compendium.tsx`, `CharacterSheet.tsx`) ist sichtbar:
- Dominant: `bg-background`, `bg-card(/alpha)`, `bg-muted(/alpha)`
- Interaktion: `bg-primary`, `text-primary`, `focus:ring-primary/...`, `border-primary/...`
- Trennlinien: `border-border`
- `secondary/input` kommen als Tailwind-Colors derzeit praktisch nicht vor.

## 9) Schema-Fallstricke / Verbesserungshebel (analytisch)
- `color-scheme`: Dark ist gesetzt, Light nicht — ok, optional `color-scheme: light` für `.light`, falls 100% deterministisch gewünscht.
- Alpha-Definition: `--secondary/--input` enthalten Alpha im Token und Tailwind kann Alpha anhängen → langfristig vereinheitlichen.
- Tailwind `accent` doppelt: aufräumen, damit das Schema „kanonischer“ ist.

