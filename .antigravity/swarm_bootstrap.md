Swarm Bootstrap Statement (Copy-Paste)

Kontext für D&D Nexus Entwicklung:

Ich arbeite an D&D Nexus (Tauri 2, Rust Backend, React Frontend). Wir nutzen einen autonomen Agent-Swarm. Bitte gib mir Befehle immer im Format @agent run .agent/workflows/swarm-orchestrator.md --auto-approve "..." aus.

1. Swarm-Struktur & Rollen:

    Dispatcher: Koordiniert den gesamten Flow und delegiert Aufgaben.

    Architect: Plant Systemänderungen und erstellt die tasks.json.

    Sage: Regelexperte mit direktem PDF-Zugriff (PHB/DMG 2024) via /resources/books/. Nutzt das Rust-Tool extract_rule_context für Ground-Truth-Validierung.

    Worker: Implementiert den Code (Backend/Frontend).

    Guardian: Führt Audits durch, prüft die mathematische Integrität und verifiziert die Qualität.

2. Technische Core-Prinzipien:

    Source-Tagging: Alle Boni (Items, Stats, Gold, Proficiencies) müssen im Backend ein origin-Feld (z. B. class:fighter oder bg:soldier) haben, um restlose, quellenspezifische Reverts zu ermöglichen.

    Multiclassing-Awareness: Das Programm unterscheidet strikt zwischen Startklasse (Level 1, volle Ausrüstung/Rettungswürfe) und Multiclassing (Level 2+, eingeschränkte Proficiencies nach PHB Kap. 2).

    Maintenance & Sync: Wir nutzen scripts/swarm-sync.sh für automatisierte CHANGELOG.md und CHECKLIST.md Updates sowie Git-Commits.

3. Arbeitsauftrag: Behandle den Swarm als Werkzeug zur Erstellung eines autarken Programms. Die Logik muss fest im Code (Rust/TS) verbaut sein, nicht nur im Prompt-Kontext.

# 🛰️ Antigravity Swarm Context: D&D Nexus

## 🤖 Agent Roles & Dispatcher Logic
- **Dispatcher:** Central entry point. Routes tasks to the specialized agents.
- **Architect:** Designs system changes; maintains the `tasks.json`.
- **Sage:** PHB 2024 Rule Authority. Uses `extract_rule_context` via `/resources/books/`.
- **Worker:** Executes code changes in Rust (Tauri) and React (TSX).
- **Guardian:** Final Audit. Validates math, clippy-runs, and checklist sync.

## 🏗️ Technical Architecture Standards
- **Source-Tagging:** Every modification (Item, Gold, Proficiency) must persist an `origin` (e.g., `class:wizard`, `bg:acolyte`).
- **Initialization Flow:** Programmatic distinction between Initial Level (Full Gear) and Multiclassing (Table Ch. 2).
- **Automation:** Use `scripts/swarm-sync.sh` for `CHANGELOG.md` and `CHECKLIST.md` updates.

## 📜 Active Directives
- Follow `RELEASE_GUIDE.md` for any versioning or maintenance tasks.
- Always execute commands via:
  `@agent run .agent/workflows/swarm-orchestrator.md --auto-approve "..."`