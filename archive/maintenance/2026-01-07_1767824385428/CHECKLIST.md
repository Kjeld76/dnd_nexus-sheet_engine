# 📝 D&D Nexus - Development Roadmap & Checklist

Dieses Dokument dient als zentraler "Single Point of Truth" für den aktuellen Entwicklungsstand und die nächsten Meilensteine.

## 🚀 Aktueller Status: v1.4.3
- [x] Core-Datenextraktion (PHB 2024) abgeschlossen.
- [x] Basis-Charakterlogik & SQLite-Integration fertig.
- [x] **NEU:** Vollautomatisierte CI/CD Pipeline & Wartungs-Scripts.

---

## 🎯 Nächster Fokus: Phase 5 - Charakter-Editor & Interaktion
Ziel: Weg vom reinen "Viewer" hin zu einer interaktiven App zur Charaktererstellung.

### 1. Step-by-Step Charakter-Editor
- [ ] **Spezies-Workflow:** Auswahl lädt automatisch Merkmale, Speed und Größenkategorie.
- [ ] **Klassen-Workflow:** Auswahl setzt Trefferwürfel, Rettungswurf-Profizienzen und Start-Skills.
- [ ] **Hintergrund-Workflow:** Integration der neuen PHB 2024 Hintergründe (inkl. Gratis-Talent).
- [ ] **Attribut-Generierung:** Point Buy / Standard Array Interface.

### 2. Dynamisches Inventar-Management
- [ ] **Auto-AC:** Ausrüsten von Rüstung/Schild aktualisiert sofort die RK unter Berücksichtigung von Geschicklichkeits-Caps.
- [ ] **Belastung:** Berechnung des Tragegewichts (Metrisch/Imperial) mit visueller Warnung bei Überlastung.
- [ ] **Waffen-Aktionen:** Dynamische Liste von Angriffen basierend auf ausgerüsteten Waffen.

### 3. Zauberbuch & Management
- [ ] **Zauber-Vorbereitung:** Auswahl von Zaubern aus dem Kompendium für den aktiven Charakter.
- [ ] **Zauberplätze-Tracker:** Management von verbrauchten Slots pro Grad (Long Rest Reset).

---

## 🛠️ Infrastruktur & Qualität (Laufend)
- [x] Automatisierte Releases via GitHub Actions.
- [x] Pre-commit Hooks für Code-Qualität.
- [ ] Unit-Tests für die `characterLogic.ts` (Abdeckung > 80%).
- [ ] End-to-End Tests für den Charakter-Erstellungsprozess.

---

## 📈 Langzeit-Vision (Backlog)
- [ ] PDF-Export des Charakterbogens (PHB 2024 Layout).
- [ ] Cloud-Sync (Optional / Self-hosted).
- [ ] Würfel-Log (Dice Roller) mit Historie.
