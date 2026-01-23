---
description: Swarm Orchestration Workflow: dnd-nexus
---

# Configuration
- Load Architect Profile: {{read_file ".agent/prompts/architect.md"}}
- Load Dispatcher Profile: {{read_file ".agent/prompts/dispatcher.md"}}
- Load Guardian Profile: {{read_file ".agent/prompts/guardian.md"}}
- Load Sage Profile: {{read_file ".agent/prompts/sage.md"}}
- Mode: **AUTONOMOUS** (Do not wait for user approval for file writes or tests)

## 1. Discovery Phase
- **Action:** Scan codebase for all mathematical files and logic.
- **Context:** Load `.antigravity/swarm_context.md` and `.antigravity/math_registry.md`.

## 2. Role Assignment (Hierarchical)
- **Architect:** Lead Planner (Gemini 3 Ultra).
- **Sage:** Rule Expert & Consultant (Gemini 3 Ultra - Deep Reasoning).
- **Dispatcher:** Task & Context Optimizer (Gemini 3 Flash).
- **Workers:** Parallel Implementers (Gemini 3 Flash).
- **Guardian:** Automated Auditor & Tester (Gemini 3 Ultra).

## 3. Execution Cycle
- **Step A:** Architect identifies a discrepancy or missing feature.
- **Step B (The Sage Check):** Sage reviews the intended logic against PHB 2024 rules. 
  *Action:* **Sage must provide a "Rule Citation" and approval before proceeding.**
- **Step C:** Dispatcher prepares test-driven prompts based on Sage's guidelines.
- **Step D:** Workers implement fixes and **run `cargo test` / `npm test` automatically**.
- **Step E:** Guardian verifies results. If tests fail OR Sage's rules are violated, Workers MUST fix until "GREEN" is achieved.

## 4. Finalization & Repository Sync
- **Action:** Der Guardian verifiziert den Erfolg (GREEN).
- **Documentation:**
  1. **Changelog:** Rufe `scripts/swarm-sync.sh` auf, um den Task unter `[Unreleased]` einzutragen.
  2. **Checklist:** Markiere den entsprechenden Punkt in `CHECKLIST.md` als erledigt.
  3. **Sage-Audit:** Der Sage schreibt eine kurze Zusammenfassung der Regel-Konformität in `.agent/logs/last_audit.md`.
- **Maintenance:** Bei Erreichen eines Meilensteins (alle P1 erledigt), schlage `pnpm maintenance patch` vor.