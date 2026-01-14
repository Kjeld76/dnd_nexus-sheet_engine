# Contributing

Danke, dass du D&D Nexus verbessern willst.

## Quickstart (Entwicklung)

Voraussetzungen:

- Node.js (empfohlen: 20)
- pnpm (CI nutzt pnpm 10)
- Rust stable (Tauri 2)

Setup:

```bash
pnpm install
pnpm tauri:dev
```

## Qualitätsregeln (vor PR)

Bitte vor dem Erstellen eines PR ausführen:

```bash
pnpm lint
pnpm typecheck
pnpm test run
```

## Branching

- Arbeite in einem eigenen Branch (Feature/Fix).
- Ziel-Branch ist `main`.

## Commits

- Kurz, beschreibend, gerne im Stil `feat: ...`, `fix: ...`, `docs: ...`.
- Releases bitte über `pnpm maintenance` / `pnpm release` (siehe `RELEASE_GUIDE.md`).

## Pull Requests

- Beschreibe Motivation + Lösung kurz.
- Verlinke passende Issues (falls vorhanden).
- Halte PRs klein und fokussiert.

## Wiki (Doku)

Das Projekt nutzt eine GitHub-Wiki, die bei Releases synchronisiert werden kann.

Details: `RELEASE_GUIDE.md` und `wiki/Contribution-Guide.md`.

