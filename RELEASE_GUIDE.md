# 🚀 D&D Nexus - Release & Maintenance Guide

Dieser Guide beschreibt, wie du neue Versionen veröffentlichst und das Projekt sauber hältst.

## 🛠️ Der Maintenance-Befehl (Empfohlen)

Dies ist der **Haupt-Befehl** für den täglichen Workflow. Er kombiniert Qualitätssicherung, Bereinigung und Release in einem Schritt.

```bash
pnpm maintenance [patch|minor|major] "Deine Nachricht"
```

### Was dieser Befehl tut:
1.  **Check:** Führt `eslint` und `vitest` aus. Bei Fehlern wird der Prozess abgebrochen.
2.  **Clean:** Löscht den `dist/`-Ordner und führt `cargo clean` aus, um Speicherplatz freizugeben.
3.  **Archive:** Verschiebt alte Berichte (`AUDIT_REPORT.md`, `CHECKLIST.md`) und Debug-Logs ins Archiv.
4.  **Release:** Erhöht die Version in allen Dateien (package.json, tauri.conf.json) und aktualisiert die `README.md`.
5.  **Git:** Erstellt einen Commit, setzt einen Tag (Format: `v{VERSION}`) und pusht alles zu GitHub.
6.  **CI/CD:** Löst automatisch den Build-Prozess auf GitHub Actions aus (bei Tag-Push).

---

## 📦 Der Release-Befehl (Manuell)

Falls du nur die Version bumben willst, ohne die Wartungs-Schritte (Cleaning/Archiving) durchzuführen:

```bash
pnpm release [patch|minor|major] "Deine Nachricht"
```

### Was dieser Befehl tut:
1.  **Release:** Erhöht die Version in allen Dateien (package.json, tauri.conf.json).
2.  **Git:** Erstellt einen Commit, setzt einen Tag (Format: `v{VERSION}`) und pusht alles zu GitHub.
3.  **CI/CD:** Löst automatisch den Build-Prozess auf GitHub Actions aus (bei Tag-Push).

---

## 🤖 CI/CD & GitHub Releases

### Automatische Pipeline

Die CI/CD-Pipeline wird in folgenden Fällen ausgelöst:
- **Bei jedem Push auf `main`:** Führt Tests und Linting aus
- **Bei jedem Tag im Format `v*`:** Führt vollständigen Build & Release durch

### Release-Prozess

Nach dem Pushen eines Tags (z.B. via `maintenance` oder `release` Befehl) startet GitHub Actions automatisch:

1.  **Test & Lint Job:**
    - Installiert Dependencies
    - Führt `pnpm lint` aus
    - Führt `pnpm typecheck` aus
    - Führt `pnpm test run` aus

2.  **Build & Release Job (nur bei Tags):**
    - Installiert Dependencies (Frontend & Rust)
    - Baut das Frontend (`pnpm build`)
    - Baut die Tauri-App mit `tauri-action`
    - Erstellt ein Windows-Installer (`.msi`)
    - Erstellt einen Draft Release auf GitHub

3.  **GitHub Release:**
    - Das fertige Paket findest du unter **GitHub -> Releases** als Entwurf
    - Der Release-Name ist `D&D Nexus v{VERSION}`
    - Du kannst den Draft-Release manuell veröffentlichen, wenn alles passt

---

## 🔍 Versions-Logik (SemVer)
- **Patch:** Kleine Fehlerbehebungen (z.B. v1.4.2 -> v1.4.3).
- **Minor:** Neue Features (z.B. v1.4.2 -> v1.5.0).
- **Major:** Große Umstrukturierungen (z.B. v1.4.2 -> v2.0.0).
