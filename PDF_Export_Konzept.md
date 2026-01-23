# Aufgabe: PDF-Export-Funktion für D&D Character Sheet implementieren

## Ziel
Erweitere das DnD Nexus Sheet Engine Projekt um eine PDF-Export-Funktion, die einen vollständigen, professionell formatierten Charakterbogen als PDF generiert, basierend auf dem angehängten Beispiel-Charakterbogen (Thoradin Silberbart).

## Kontext
- **Referenz-Charakterbogen**: `character_sheet_thoradin_final.pdf` (siehe angehängtes Dokument)
- **Regelbuch**: `/spielerhandbuch/daten/projects/dnd_nexus-sheet_engine/resources/books/D&D Spielerhandbuch (2024).pdf`
- **Projekt**: DnD Nexus Sheet Engine
- **Ausgabeformat**: PDF-Datei, die das Layout und die Struktur des Referenz-Charakterbogens nachbildet

## Anforderungen

### 1. PDF-Layout & Design
Erstelle ein PDF-Layout, das folgende Bereiche enthält (orientiert am Referenz-Charakterbogen):

**Kopfbereich:**
- Charaktername, Hintergrund, Klasse, Spezies, Unterklasse
- Gesinnung, Stufe, EP
- Rüstungsklasse (mit Schild-Wert in Klammern)
- Trefferpunkte (Aktuell/Max/Temporär)
- Trefferwürfel (Anzahl + Typ)
- Todesrettungswürfe (Erfolge/Misserfolge)
- Übungsbonus

**Attribute & Fertigkeiten:**
- Alle 6 Hauptattribute (STR, DEX, CON, INT, WIS, CHA)
- Modifikatoren und Basiswerte
- Rettungswürfe mit Übungsmarkierung
- Zugehörige Fertigkeiten mit Übungsmarkierung und Bonuswerten
- Expertise-Kennzeichnung wo zutreffend

**Kampfwerte:**
- Initiative
- Bewegungsrate
- Grösse
- Passive Wahrnehmung
- Vertrautheit mit Rüstungen, Waffen, Werkzeugen

**Waffen & Angriffe:**
- Tabellarische Darstellung mit: Name, Angriffsbonus/SG, Schaden & Art, Notizen
- Inklusive magischer Waffen und Shillelagh-Effekte

**Rüstung & Effekte:**
- Getragene Rüstung und Schild
- Aktive Auren und magische Effekte
- Segen und besondere Fähigkeiten

**Klassenmerkmale & Talente:**
- Alle Klassenmerkmale ab Stufe 1
- Erworbene Talente mit Kurzbeschreibung
- Volksmerkmale

**Ausrüstung:**
- Körper (getragen)
- Rucksack
- Lasttier
- Bag of Holding
- Münzen (KM, SM, GM, PM)
- Gesamtgewicht und Tragekapazität

**Magische Gegenstände:**
- Liste eingestimmter Gegenstände
- Aktive Modifikatoren von magischen Gegenständen

**Zauberwirken (für Zauberwirker):**
- Zauberwirkende Klasse und Attribut
- Zauber-SG und Angriffsbonus
- Zauberplätze pro Grad (0-9) mit Verbrauchsanzeige
- Liste vorbereiteter Zauber/Zaubertricks

**Zusätzliche Bereiche:**
- Aussehen & Beschreibung
- Sprachen
- Geschichte & Persönlichkeit
- Ressourcen (Tiergestalt-Verwendungen, Erschöpfung, etc.)

### 2. Technische Umsetzung

**Export-Button in der UI:**
- Füge einen "Als PDF exportieren" Button zur Charakter-Ansicht hinzu
- Button sollte gut sichtbar, aber nicht aufdringlich platziert sein
- Loading-Indikator während der PDF-Generierung

**PDF-Generierung:**
- Verwende eine geeignete PDF-Bibliothek (z.B. jsPDF, PDFKit, oder React-PDF)
- Implementiere ein mehrseitiges Layout (vermutlich 2-3 Seiten)
- Stelle sicher, dass alle Daten korrekt aus dem Charaktermodell gelesen werden
- Berücksichtige dynamische Inhalte (unterschiedliche Anzahl an Zaubern, Ausrüstung, etc.)

**Formatierung & Styling:**
- Verwende eine klare, gut lesbare Schriftart
- Nutze Tabellen für strukturierte Daten (Waffen, Ausrüstung, Zauber)
- Implementiere Checkboxen/Markierungen für Übungen, verbrauchte Ressourcen
- Achte auf konsistente Abstände und Ausrichtung
- Nutze Rahmen/Boxen zur visuellen Gruppierung

**Datenvalidierung:**
- Überprüfe, ob alle notwendigen Charakterdaten vorhanden sind
- Zeige aussagekräftige Fehlermeldungen bei fehlenden Daten
- Fülle fehlende optionale Felder mit sinnvollen Standardwerten

### 3. Fehlende Funktionen auf Checklist

Analysiere, welche Funktionen für den vollständigen PDF-Export noch nicht implementiert sind und füge sie zur `checklist.md` hinzu. Beispiele könnten sein:

- [ ] Berechnung von abgeleiteten Werten (Initiative, passive Wahrnehmung)
- [ ] Verwaltung von Zauberplätzen und deren Verbrauch
- [ ] Tracking von Todesrettungswürfen
- [ ] Verwaltung temporärer Trefferpunkte
- [ ] Erschöpfungssystem
- [ ] Ressourcen-Tracking (z.B. Tiergestalt-Verwendungen)
- [ ] Magische Gegenstände mit Einstimmung
- [ ] Modifikatoren von magischen Gegenständen
- [ ] Gewichtsberechnung und Tragekapazität
- [ ] Expertise-Markierung für Fertigkeiten
- [ ] Sprachen-Verwaltung
- [ ] Hintergrund und Persönlichkeitsmerkmale

### 4. Regelbuch-Referenzierung

Beim Implementieren der Berechnungen und Regeln:
- Konsultiere das D&D Spielerhandbuch (2024) für korrekte Regelumsetzung
- Dokumentiere Regelreferenzen in Code-Kommentaren
- Stelle sicher, dass Berechnungen (Modifikatoren, Boni, etc.) regelkonform sind

## Deliverables

1. **PDF-Export-Funktion**: Vollständig implementierte Export-Funktion mit Button in der UI
2. **PDF-Template**: Mehrseitiges PDF-Layout basierend auf dem Referenz-Charakterbogen
3. **Aktualisierte checklist.md**: Alle fehlenden Funktionen dokumentiert
4. **Code-Dokumentation**: Kommentare zu Berechnungen und Regelreferenzen
5. **Test-Export**: Funktionierender Export mit dem Thoradin-Beispielcharakter

## Hinweise

- Priorisiere Lesbarkeit und Übersichtlichkeit des PDFs über aufwändiges Design
- Achte auf Seitenumbrüche an sinnvollen Stellen
- Teste den Export mit verschiedenen Charakterkonstellationen (verschiedene Klassen, Stufen)
- Stelle sicher, dass das PDF druckfreundlich ist (schwarz-weiß, klare Kontraste)
- Nutze das angehängte Thoradin-PDF als visuelle Referenz für Layout-Entscheidungen

## Erfolgsmetriken

Der PDF-Export gilt als erfolgreich implementiert, wenn:
- Ein vollständiger Charakterbogen als PDF exportiert werden kann
- Alle relevanten Charakterdaten korrekt dargestellt werden
- Das Layout übersichtlich und druckfreundlich ist
- Die checklist.md alle fehlenden Funktionen auflistet
- Der Export mit dem Thoradin-Beispiel funktioniert