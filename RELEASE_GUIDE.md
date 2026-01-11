# 🚀 D&D Nexus - Release & Maintenance Guide

Dieser Guide beschreibt, wie du neue Versionen veröffentlichtst und das Projekt sauber hältst.

## 🤖 CI/CD & Automatisierung

D&D Nexus nutzt eine Pipeline, um die Entwicklung zu beschleunigen und die Qualität sicherzustellen. Hier ist das komplette System im Detail erklärt.

### 1. Automatische Versionierung (Sync)

Wenn eine neue Version veröffentlicht wird, sorgt das Script `scripts/release.ts` dafür, dass die Versionsnummer in allen relevanten Dateien identisch ist. Dies verhindert Inkonsistenzen zwischen dem Frontend, dem Rust-Core und der Dokumentation.

**Synchronisierte Dateien:**

- `package.json` (Frontend & Projekt-Basis)
- `src-tauri/tauri.conf.json` (Tauri-Konfiguration)
- `src-tauri/Cargo.toml` (Rust-Backend)
- `README.md` (Versions-Marker im Header)
- `wiki/Home.md` (Online-Dokumentation)

### 2. Der Maintenance-Workflow

Das Haupt-Script `scripts/maintenance.ts` ist der "Orchestrator" des Projekts. Es wird über `pnpm maintenance` aufgerufen.

**Der Ablauf:**

1. **Qualitätssicherung (QA):** Ausführung von `pnpm lint` und `pnpm test`. Bei Fehlern bricht der Prozess sofort ab.
2. **Clean-Up:** Löschen des `dist/`-Ordners und Ausführung von `cargo clean`, um Speicherplatz zu sparen.
3. **Archivierung:** Automatisches Verschieben von Audit-Berichten und Logs in den `archive/`-Ordner (mit Zeitstempel).
4. **Versioning & Git:** Aufruf des Release-Scripts, Erstellen des Git-Commits und Setzen des Versions-Tags (z.B. `v1.5.0`).
5. **Wiki-Push:** Automatisches Hochladen der aktualisierten Dokumentation in das GitHub-Wiki.
6. **Globaler Push:** Übertragung des Codes und der Tags zu GitHub, was die Cloud-Pipeline auslöst.

### 3. Cloud-Pipeline (GitHub Actions)

Sobald der Code bei GitHub ankommt, übernimmt die Datei `.github/workflows/release.yml`.

**Job 1: Test & Lint (CI)**

Bei jedem Push zu `main` oder einem Pull Request prüft GitHub auf einem Windows-Server:

- Werden alle Abhängigkeiten korrekt installiert?
- Gibt es Linter-Fehler?
- Bestehen alle automatisierten Tests?

**Job 2: Build & Release (CD)**

Wird ein Push mit einem Versions-Tag (z.B. `v1.5.0`) erkannt, startet der Build-Prozess:

- **Kompilierung:** Die Rust-App wird für Windows gebaut.
- **Paketierung:** Erstellung eines `.msi`-Installers.
- **Draft Release:** GitHub erstellt automatisch einen Release-Entwurf unter "Releases" und hängt den fertigen Installer als Download an.

## Zusammenfassung für Entwickler

Dein einziger Job ist das Ausführen von:

```bash
pnpm maintenance [patch|minor|major] "Deine Nachricht"
```

Alles andere – vom Testen über das Aufräumen bis hin zum fertigen Installer in der Cloud – passiert vollautomatisch.

---

## 📦 Der Release-Befehl (Manuell)

Falls du nur die Version bumben willst, ohne die Wartungs-Schritte (Cleaning/Archiving) durchzuführen:

```bash
pnpm release [patch|minor|major] "Deine Nachricht"
```

### Was dieser Befehl tut:

1. **Versionierung:** Erhöht die Version in allen synchronisierten Dateien (package.json, tauri.conf.json, Cargo.toml, README.md, wiki/Home.md).
2. **Git:** Erstellt einen Commit, setzt einen Tag (Format: `v{VERSION}`) und pusht alles zu GitHub.
3. **CI/CD:** Löst automatisch den Build-Prozess auf GitHub Actions aus (bei Tag-Push).

---

## 🔍 Versions-Logik (SemVer)

- **Patch:** Kleine Fehlerbehebungen (z.B. v1.4.2 -> v1.4.3).
- **Minor:** Neue Features (z.B. v1.4.2 -> v1.5.0).
- **Major:** Große Umstrukturierungen (z.B. v1.4.2 -> v2.0.0).
