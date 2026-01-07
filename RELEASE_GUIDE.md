# 🚀 D&D Nexus - Release & Maintenance Guide

Dieser Guide beschreibt, wie du neue Versionen veröffentlichst und das Projekt sauber hältst.

## 🛠️ Der Maintenance-Befehl (Empfohlen)

Dies ist der **Haupt-Befehl** für den täglichen Workflow. Er kombiniert Qualitätssicherung, Bereinigung und Release in einem Schritt.

```powershell
pnpm maintenance [patch|minor|major] "Deine Nachricht"
```

### Was dieser Befehl tut:
1.  **Check:** Führt `eslint` und `vitest` aus. Bei Fehlern wird der Prozess abgebrochen.
2.  **Clean:** Löscht den `dist/`-Ordner und führt `cargo clean` aus, um Speicherplatz freizugeben.
3.  **Archive:** Verschiebt alte Berichte (`AUDIT_REPORT.md`, `CHECKLIST.md`) und Debug-Logs ins Archiv.
4.  **Release:** Erhöht die Version in allen Dateien und aktualisiert die `README.md`.
5.  **Git:** Erstellt einen Commit, setzt einen Tag und pusht alles zu GitHub.
6.  **CI/CD:** Löst automatisch den Build-Prozess auf GitHub Actions aus.

---

## 📦 Der Release-Befehl (Manuell)

Falls du nur die Version bumben willst, ohne die Wartungs-Schritte (Cleaning/Archiving) durchzuführen:

```powershell
pnpm release [patch|minor|major] "Deine Nachricht"
```

---

## 🤖 CI/CD & GitHub Releases

Nach jedem Push via `maintenance` oder `release` startet GitHub Actions automatisch:
1.  **Test & Lint:** Validiert den Code in einer sauberen Umgebung.
2.  **Build & Release:** Erstellt eine Windows-App (`.msi`).
3.  **Draft Release:** Du findest das fertige Paket unter **GitHub -> Releases** als Entwurf.

---

## 🔍 Versions-Logik (SemVer)
- **Patch:** Kleine Fehlerbehebungen (z.B. v1.4.2 -> v1.4.3).
- **Minor:** Neue Features (z.B. v1.4.2 -> v1.5.0).
- **Major:** Große Umstrukturierungen (z.B. v1.4.2 -> v2.0.0).
