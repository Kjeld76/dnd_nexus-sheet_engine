# 🚀 D&D Nexus - Release Guide

Diese Datei beschreibt die Nutzung des automatisierten Release-Scripts, um die App-Versionen synchron zu halten und auf Git zu pushen.

## 🛠️ Der Release-Befehl

Das Script hält automatisch die Versionen in `package.json`, `src-tauri/tauri.conf.json` und `src-tauri/Cargo.toml` synchron.

### Befehlsstruktur
```powershell
pnpm release [typ] "Deine Nachricht"
```

### 1. Patch (Kleine Fixes)
Erhöht die letzte Stelle (z.B. v1.3.1 -> v1.3.2).
```powershell
pnpm release patch "fixed small ui bug"
```

### 2. Minor (Neue Features)
Erhöht die mittlere Stelle (z.B. v1.3.1 -> v1.4.0).
```powershell
pnpm release minor "added character inventory"
```

### 3. Major (Große Updates)
Erhöht die erste Stelle (z.B. v1.3.1 -> v2.0.0).
```powershell
pnpm release major "complete redesign"
```

---

## 🔍 Was das Script im Hintergrund tut:
1.  **Version auslesen:** Ermittelt die aktuelle Version aus der `package.json`.
2.  **Bumping:** Berechnet die neue Versionsnummer basierend auf dem Typ.
3.  **Sync:** Schreibt die neue Version in alle relevanten Dateien (Frontend, Tauri, Rust).
4.  **Git Stage:** Führt `git add .` aus.
5.  **Git Commit:** Erstellt einen Commit mit der Nachricht `chore: release vX.X.X - [Nachricht]`.
6.  **Git Tag:** Setzt einen lokalen Git-Tag für die Version.
7.  **Git Push:** Schiebt den Code und die Tags auf den Remote-Server (GitHub).

> **Hinweis:** Stelle sicher, dass du alle Änderungen gespeichert hast, bevor du den Befehl ausführst.

