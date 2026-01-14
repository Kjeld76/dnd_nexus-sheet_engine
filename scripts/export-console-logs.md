# Console Logs exportieren

## Methode 1: Direkt in DevTools kopieren

1. Öffne DevTools (F12 oder Menü → Ansicht → Entwicklertools)
2. Gehe zum Tab "Console"
3. **Rechtsklick** in der Console
4. Wähle "Save as..." oder "Speichern unter..."
5. Oder: **Strg+A** (Alles auswählen) → **Strg+C** (Kopieren) → In Textdatei einfügen

## Methode 2: Browser-Console Export

1. Öffne DevTools (F12)
2. Gehe zum Tab "Console"
3. Rechtsklick auf die Console
4. Wähle "Save as..." oder nutze die Export-Funktion des Browsers

## Methode 3: Über die Console API (Programmatisch)

Führe in der Browser-Console aus:
```javascript
// Alle Logs kopieren
const logs = [];
console.log = function(...args) {
  logs.push(args.join(' '));
  originalLog.apply(console, args);
};
```

## Methode 4: Screenshot

1. Öffne DevTools (F12)
2. Gehe zum Tab "Console"
3. Mache einen Screenshot (Strg+Shift+S oder Screenshot-Tool)
