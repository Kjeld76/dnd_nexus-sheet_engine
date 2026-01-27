# D&D Nexus

D&D 5e 2024 Character Sheet Manager - Desktop-Anwendung für Spieler und Game Master

## Übersicht

D&D Nexus ist eine moderne Desktop-Anwendung zur Verwaltung von D&D 5e Charakteren basierend auf den Regeln von 2024. Die App bietet umfassende Charakterverwaltung, ein vollständiges Kompendium und die Möglichkeit, eigene Inhalte zu erstellen.

## Hauptfunktionen

### Charakterverwaltung

#### Charakter-Erstellung und -Verwaltung
- **Charakter-Erstellung**: Schnelle Erstellung neuer Charaktere mit Vorlagen
- **Charakter-Listen**: Übersicht aller erstellten Charaktere
- **Charakter-Details**: Vollständige Charakterbögen mit allen relevanten Informationen
- **Tab-Navigation**: Einfaches Wechseln zwischen Kampf, Zauber, Inventar und Notizen
- **Charakter-Speicherung**: Automatische Speicherung aller Charakterdaten in lokaler Datenbank

#### Attribute und Rettungswürfe
- **6 Grundattribute**: Stärke, Geschick, Konstitution, Intelligenz, Weisheit, Charisma
- **Attributswerte**: Direkte Eingabe von Attributswerten (1-30)
- **Automatische Modifikatoren**: Berechnung der Attributsmodifikatoren (+/-)
- **Rettungswürfe**: Anzeige von Vorteilen bei Rettungswürfen basierend auf Spezies-Merkmalen
- **Proficiencies**: Markierung von Proficiencies für Rettungswürfe

#### Fertigkeiten (Skills)
- **18 Fertigkeiten**: Alle Standard-Fertigkeiten aus D&D 5e
- **Proficiencies**: Markierung von Fertigkeiten mit Proficiency oder Expertise
- **Automatische Berechnung**: Gesamtbonus basierend auf Attribut, Proficiency und Modifikatoren
- **Spezies-Modifikatoren**: Anzeige von Vorteilen bei Fertigkeiten basierend auf Spezies-Merkmalen

#### Spezies (Species)
- **Spezies-Auswahl**: Auswahl aus verfügbaren Spezies (PHB 2024)
- **Automatische Anwendung**: 
  - Geschwindigkeit (Bewegungsrate) - wird automatisch auf Charakterbogen übernommen
  - Größenkategorie - wird angezeigt und berücksichtigt
  - Sprachen (automatisches Hinzufügen von Sprachen zur Proficiencies-Liste)
  - Attribute (wenn vorhanden, z.B. bei Homebrew-Spezies)
- **Spezies-Merkmale (Traits)**: 
  - Vollständige Anzeige aller Merkmale mit Beschreibungen
  - Automatische Erkennung mechanischer Effekte aus Beschreibungen
  - Vorteile bei Rettungswürfen: Automatische Erkennung und Anzeige als Badge
  - Vorteile bei Fertigkeiten: Automatische Erkennung und Anzeige als "V"-Badge
  - Visuelle Anzeige: Badges direkt auf Attributs- und Fertigkeits-Bereichen
- **Choice-basierte Attribute**: 
  - Dialog für Spezies mit wählbaren Attributssteigerungen
  - Flexible Zuteilung von Attributspunkten nach Spielerpräferenz

#### Klassen (Classes)
- **Klassen-Auswahl**: Auswahl aus verfügbaren Klassen
- **Unterklassen**: Unterstützung für Klassen mit Unterklassen

#### Hintergründe (Backgrounds)
- **Hintergrund-Auswahl**: Auswahl aus verfügbaren Hintergründen (PHB 2024)
- **Automatische Anwendung**:
  - **Attributswerte**: Dialog zur Auswahl zwischen +2/+1 oder +1/+1/+1
    - Dialog wird automatisch angezeigt, wenn Hintergrund gewechselt wird
    - Auswahl wird auf Charakterbogen angewendet und gespeichert
  - **Werkzeug-Auswahl**: Dialog zur Auswahl eines Werkzeugs (falls wählbar)
    - Automatisches Hinzufügen zur Proficiencies-Liste
    - Automatisches Hinzufügen zum Inventar
    - Unterstützung für Varianten: Spielsets (Drachenschach, Drei-Drachen-Ante, Spielkarten, Würfel) und Musikinstrumente (10 Varianten)
    - Verbessertes Kategorie-Matching findet alle relevanten Tools
  - **Starting Equipment**: Dialog zur Auswahl zwischen Option A oder B (falls vorhanden)
    - Automatisches Hinzufügen gewählter Items zum Inventar (mit Unterstützung für Mengen und Varianten)
    - Automatisches Hinzufügen von Gold (falls vorhanden)
    - **Intelligentes Gold-Tracking**: Gold wird beim Hintergrund-Wechsel automatisch wieder abgezogen
  - **Herkunftstalent (Feat)**: Automatisches Hinzufügen des Hintergrund-Feats
  - **Fertigkeiten**: Automatisches Hinzufügen von zwei Fertigkeiten zur Proficiencies-Liste
- **Hintergrund-Wechsel**: 
  - Automatisches Entfernen aller alten Hintergrund-Boni beim Wechsel (Attribute, Feats, Fertigkeiten, Werkzeuge, Items, Gold)
  - "Clean-First" Prinzip sorgt für stabile Dialog-Sequenzen beim Wechsel
  - Alle Dialoge werden erneut angezeigt für den neuen Hintergrund
- **Herkunftstalent-Anzeige**: Dedizierte Anzeige aller aktiven Talente (inkl. Hintergrund-Talent) im Charakterbogen
- **Persistent Tracking**: Rust-Backend speichert den Fortschritt der Hintergrund-Anwendung (Wahlen/Boni) dauerhaft

#### Kampf-Statistiken
- **Rüstungsklasse (AC)**: Automatische Berechnung basierend auf Rüstung
- **Initiative**: Basierend auf Geschick
- **Geschwindigkeit**: Basierend auf Spezies
- **Lebenspunkte (HP)**: 
  - Aktuelle HP
  - Maximale HP
  - Temporäre HP
  - Hit Dice (Verwendet/Verfügbar)
  - Todesrettungen (Erfolge/Fehlschläge)

#### Modifikatoren (Modifiers)
- **Manuelle Modifikatoren**: Hinzufügen von benutzerdefinierten Modifikatoren
- **Quellenverfolgung**: Jeder Modifikator hat eine Quelle (z.B. "Magischer Gegenstand", "Zauber", etc.)
- **Modifikator-Typen**: 
  - Override: Ersetzt den Basiswert
  - Add: Addiert zum Basiswert
  - Multiply: Multipliziert den Basiswert
- **Zielgruppierung**: Modifikatoren werden nach Ziel (Attribut, Fertigkeit, etc.) gruppiert angezeigt
- **Bedingte Modifikatoren**: Optional: Modifikatoren können Bedingungen haben
- **Entfernen**: Möglichkeit, Modifikatoren zu entfernen

#### Inventar
- **Gegenstände**: Verwaltung von Ausrüstung und Gegenständen aus dem Kompendium
- **Waffen**: 
  - Verwaltung von Waffen (wird aus Kompendium geladen)
  - Waffenstatistiken (Schaden, Eigenschaften, etc.)
- **Rüstungen**: 
  - Verwaltung von Rüstungen (wird aus Kompendium geladen)
  - Automatische Berechnung der Rüstungsklasse (AC)
- **Werkzeuge**: 
  - **Eigener Bereich**: Dedizierte Liste für Werkzeuge im Inventar
  - 39 Werkzeuge aus PHB 2024 (Handwerkszeug, Anderes Werkzeug)
  - Varianten-Support: Musikinstrumente (10 Varianten) und Spielsets (4 Varianten)
  - Vollständige Informationen: Attribut, Verwenden-Aktionen, Herstellen-Listen
  - Automatisches Hinzufügen bei Background-Auswahl
- **Gewichtsberechnung**: 
  - Automatisches Gesamtgewicht (Körper + Rucksack + Werkzeuge + Ausrüstung)
  - **Info-Tooltip**: Detaillierte Aufschlüsselung der berechneten Bereiche via Hover-Icon
- **Währungs-Management**: Gold, Silber, Kupfer mit automatischem Tracking für Hintergrund-Boni
- **Ausrüstung**: Verwaltung von Ausrüstung und anderen Gegenständen

### Kompendium

#### Verfügbare Kategorien
- **Zauber (Spells)**: Vollständige Zauberliste mit allen Details
- **Klassen (Classes)**: Alle Klassen mit Unterklassen
- **Spezies (Species)**: Alle Spezies mit Merkmalen
- **Waffen (Weapons)**: Waffenstatistiken und Eigenschaften
- **Rüstungen (Armor)**: Rüstungsstatistiken und Eigenschaften
- **Werkzeuge (Tools)**: Werkzeuginformationen
- **Gegenstände (Items)**: Verschiedene Gegenstände und Ausrüstung
- **Ausrüstungspakete (Equipment)**: Vorgefertigte Ausrüstungspakete (z.B. Entdeckerausrüstung)
  - **Deep-Linking**: Klick auf Items in Paketen öffnet direkt die Item-Details
  - **Normalisierte Daten**: Items und Werkzeuge aus relationalen Tabellen
- **Talente (Feats)**: Alle verfügbaren Talente
- **Fertigkeiten (Skills)**: Fertigkeitsinformationen
- **Hintergründe (Backgrounds)**: Vollständige Hintergrund-Informationen

#### Kompendium-Features
- **Suche**: Durchsuchbares Kompendium mit Echtzeit-Filterung über alle Kategorien
- **Detaillierte Ansicht**: Vollständige Informationen zu jedem Eintrag
  - Beschreibungen und Flavor-Text
  - Mechanische Eigenschaften (Level, Schule, Zeitaufwand, Reichweite, etc.)
  - Statistiken (Schaden, AC, Gewicht, Kosten, etc.)
  - Quellenangaben (PHB 2024, Core, Homebrew, Override)
- **Quellen-Markierung**: 
  - Klare visuelle Kennzeichnung von Core-Content vs. Homebrew vs. Override
  - Badges zur schnellen Identifikation der Quelle
- **Kategorien**: 
  - Zauber: Vollständige Zauberliste mit allen Details
  - Klassen: Alle Klassen mit Unterklassen und Features
  - Spezies: Alle Spezies mit Merkmalen und Eigenschaften
  - Waffen: Waffenstatistiken, Eigenschaften und Meisterschaften
  - Rüstungen: Rüstungsstatistiken und Eigenschaften
  - Werkzeuge: Werkzeuginformationen und Kategorien
    - 39 Werkzeuge aus PHB 2024 (Handwerkszeug, Anderes Werkzeug)
    - Varianten-Support: Musikinstrumente (10 Varianten) und Spielsets (4 Varianten)
    - Vollständige Daten: Attribut, Verwenden-Aktionen, Herstellen-Listen
    - Kategorie-basierte Filterung und Gruppierung
  - Ausrüstung: Verschiedene Ausrüstungsgegenstände
  - Talente: Alle verfügbaren Talente mit Beschreibungen
  - Fertigkeiten: Fertigkeitsinformationen und zugehörige Attribute
  - Hintergründe: Vollständige Hintergrund-Informationen mit Attributswerten, Talenten, Fertigkeiten, Werkzeugen und Beschreibungen

### Homebrew & Custom Content

#### Editor
- **Vollständiger Editor**: Erstellen und Bearbeiten von eigenen Inhalten
- **Unterstützte Typen**:
  - Zauber: Vollständige Zaubererstellung mit allen Eigenschaften
  - Klassen: Erstellen von Custom-Klassen mit Features
  - Spezies: Erstellen von Custom-Spezies mit Merkmalen
  - Waffen: Erstellen von Custom-Waffen mit Statistiken
  - Rüstungen: Erstellen von Custom-Rüstungen mit AC und Eigenschaften
  - Werkzeuge: Erstellen von Custom-Werkzeugen
  - Ausrüstung: Erstellen von Custom-Ausrüstungsgegenständen
- **Formular-Editor**: Benutzerfreundliches Formular für die meisten Felder
- **JSON-Editor**: 
  - Direkter Zugriff auf JSON-Daten für erweiterte Bearbeitung
  - Vollständige Kontrolle über alle Datenfelder
  - Copy-to-Clipboard Funktion für einfachen Datenaustausch
- **Quellenverwaltung**: 
  - Markierung als Core (PHB) oder Homebrew/Custom
  - Override-Funktion: Überschreiben von Core-Inhalten mit angepassten Versionen
  - Parent-Referenzen: Verknüpfung mit ursprünglichen Core-Einträgen

#### Datenmanagement
- **Lokale Datenbank**: Alle Daten werden lokal in SQLite-Datenbank gespeichert
- **Persistenz**: Homebrew-Inhalte bleiben nach Neustart erhalten
- **Bearbeitung**: Vollständige Bearbeitung eigener Inhalte (Name, Eigenschaften, etc.)
- **Löschen**: Möglichkeit, eigene Inhalte zu löschen (Core-Inhalte sind geschützt)
- **Datenintegrität**: Automatische Validierung und Fehlerbehandlung

### Import & Export

#### Charakter-Import/Export
- **Charakter exportieren**: Export einzelner Charaktere als JSON-Datei
- **Charakter importieren**: Import von Charakteren aus JSON-Dateien
- **Datenübertragung**: Einfacher Austausch von Charakteren zwischen Installationen

#### PDF-Export
- **Charakterbogen als PDF**: Export des vollständigen Charakterbogens als PDF-Datei
- **PHB 2024 Layout**: Formatierung entsprechend dem offiziellen Charakterbogen-Layout

#### Backup & Wiederherstellung
- **Datenbank-Backup**: Erstellen von Sicherungskopien der gesamten Datenbank
- **Datenwiederherstellung**: Wiederherstellung von Daten aus Backup-Dateien

### Einstellungen & Anpassungen

#### Anwendungseinstellungen
- **Theme**: Wechsel zwischen hellem und dunklem Design
- **Metrische/Empirische Einheiten**: Umstellung zwischen metrischen und imperialen Maßeinheiten
- **Persistente Einstellungen**: Alle Einstellungen werden gespeichert und bleiben erhalten

### Game Master Features

#### Kompendium-Verwaltung
- **Vollständiges Regelwerk**: Zugriff auf alle PHB 2024 Inhalte
- **Schnelle Referenz**: Schnelle Suche nach Zaubern, Waffen, Rüstungen, etc.
- **Detaillierte Informationen**: Vollständige Beschreibungen und mechanische Details

#### Homebrew-Content für die Gruppe
- **Gruppen-spezifische Inhalte**: Erstellen von Homebrew-Inhalten für die eigene Kampagne
- **Override-Funktion**: Überschreiben von Core-Inhalten mit angepassten Versionen
- **Quellenverwaltung**: Klare Kennzeichnung von Core vs. Homebrew vs. Override

#### Charakter-Verwaltung für mehrere Spieler
- **Mehrere Charaktere**: Verwaltung mehrerer Charaktere in einer Installation
- **Schneller Wechsel**: Einfaches Wechseln zwischen verschiedenen Charakteren
- **Organisation**: Übersichtliche Liste aller erstellten Charaktere

### Technische Features

#### Benutzerfreundlichkeit
- **Tastenkürzel**: 
  - `Ctrl+S`: Charakter speichern
- **Auto-Save**: Automatisches Speichern bei Änderungen
- **Desktop-optimiertes Design**: Vollständige Nutzung der Bildschirmbreite, nicht kompakt wie Mobile-Apps
- **Dark/Light Mode**: Anpassbares Farbschema für bessere Lesbarkeit

#### Datenverwaltung
- **Lokale Speicherung**: Alle Daten werden lokal in SQLite-Datenbank gespeichert
- **Keine Cloud-Abhängigkeit**: Komplette Offline-Funktionalität
- **Datenintegrität**: Sichere Speicherung und Validierung
- **Performance**: Optimierte Datenbankabfragen für schnelle Ladezeiten

## Installation

Siehe [RELEASE_GUIDE.md](./RELEASE_GUIDE.md) für detaillierte Installationsanleitung.

## Verwendung

### Charakter erstellen
1. Starte die Anwendung
2. Klicke auf "Neuer Held" auf der Startseite
3. Wähle Klasse, Spezies und Unterklasse (optional)
4. Passe Attribute, Fertigkeiten und Ausrüstung an
5. Charakter wird automatisch gespeichert

### Kompendium durchsuchen
1. Wechsle zum Kompendium (linke Sidebar)
2. Wähle eine Kategorie (Zauber, Klassen, etc.)
3. Nutze die Suche zum Filtern
4. Klicke auf einen Eintrag für Details

### Homebrew-Inhalt erstellen
1. Öffne das Kompendium
2. Klicke auf "Neu" (grüner Button)
3. Wähle den Typ (Zauber, Waffe, etc.)
4. Fülle die Formularfelder aus
5. Nutze den JSON-Editor für erweiterte Optionen
6. Speichere den Eintrag

### Modifikatoren hinzufügen
1. Öffne einen Charakter
2. Scrolle zum "Modifikatoren"-Bereich
3. Füge manuelle Modifikatoren hinzu (Benutzerdefiniert)
4. Modifikatoren werden automatisch auf relevante Werte angewendet

## Systemanforderungen

- **OS**: Windows, macOS, Linux
- **RAM**: 4 GB (empfohlen: 8 GB)
- **Platz**: ~200 MB für die Anwendung
- **Internet**: Optional (nur für Updates)

## Entwicklung

Siehe [RELEASE_GUIDE.md](./RELEASE_GUIDE.md) für Entwicklungsumgebung und Build-Anweisungen.

## Lizenz

MIT (siehe `LICENSE`)
