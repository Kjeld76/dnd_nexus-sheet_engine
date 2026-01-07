# D&D Nexus: Cloud-Migration & Zentralisierung

## Status Quo
* **Architektur:** Standalone Desktop-App (Tauri 2.0).
* **Datenhaltung:** Lokal (`rusqlite`).
* **Identität:** Keine (Anonyme lokale Nutzung).

## Ziel-Architektur (Hybrid-Cloud)
Übergang von einer isolierten App zu einem zentral verwalteten System mit Benutzerrechten und synchronisierter Datenbank.



---

## 1. Infrastruktur-Komponenten

### Backend-Server (Neu)
* **Technologie:** Rust (Framework: `Axum` oder `Actix-web`).
* **Aufgabe:** Validierung von Daten, Rechteprüfung, Bereitstellung der Core-Regeln.
* **Datenbank:** PostgreSQL (empfohlen für Multi-User-Concurrency).

### Tauri Desktop Client (Anpassung)
* **Rolle:** Fungiert als "Thin Client".
* **Kommunikation:** Ersetzt direkte SQLite-Dateizugriffe durch HTTP-Calls (via `reqwest` im Rust-Backend oder `fetch` im Frontend).

---

## 2. Erweitertes Datenmodell (Permissions)

Um Benutzer und Rechte zentral zu verwalten, wird das Schema um Identitäts-Metadaten erweitert:

### Benutzer & Rollen
* **User:** `id`, `username`, `password_hash`, `role`.
* **Rollen:** * `ADMIN`: Kann Core-Daten (Spells, Species) für alle ändern.
    * `MODERATOR`: Kann Homebrew-Inhalte prüfen/freigeben.
    * `PLAYER`: Kann eigene Charaktere erstellen/lesen/editieren.

### Ownership-Logik
Jeder Datensatz in der zentralen Datenbank erhält eine `owner_id`.
```sql
-- Beispiel für die Charakter-Tabelle auf dem Server
CREATE TABLE characters (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES users(id),
  campaign_id UUID NULL,
  data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT FALSE
);
3. Strategie für die Umstellung (Roadmap)
Phase 1: Authentication Layer
Implementierung eines JWT-basierten Logins (JSON Web Token).

Speicherung des Tokens im sicheren System-Store (via Tauri Plugin stronghold oder OS-Keyring).

Phase 2: API Integration (Frontend/Backend Split)
Frontend: api.ts wird umgeschaltet.

Alt: invoke('get_character', { id })

Neu: Call an den API-Server mit Authorization: Bearer <token>.

Rust-Backend (Tauri): Kann weiterhin als Proxy dienen, um Requests zu signieren oder Offline-Caching zu verwalten.

Phase 3: Zentralisierte Core-Daten
Verschiebung der core_spells etc. vom lokalen Parser auf den Server.

Vorteil: Regel-Fixes im PHB 2024 sind sofort für alle Nutzer aktiv, ohne App-Update.

4. Wichtige technische Implikationen
Offline-Modus: Ohne Internet ist kein Login möglich.

Lösung: Implementierung einer "Sync-Queue". Änderungen werden lokal in SQLite gepuffert und bei bestehender Verbindung zum Server "gepusht".

Sicherheit: Da der Server nun öffentlich erreichbar ist, müssen alle Tauri-Commands gegen Injections und unbefugte Datenabfragen (IDOR) abgesichert werden.

Kosten: Ein zentraler Server (z.B. Hetzner, AWS, DigitalOcean) ist für den Betrieb der Datenbank notwendig.

5. Cursor-Befehl (Snippet für die KI)
Kopiere dies in deinen Cursor-Kontext, wenn du die Umstellung startest:

"Überarbeite die bestehende Tauri-Architektur. Ersetze die lokalen SQLite-Commands durch eine API-Struktur. Erstelle ein Benutzer-Schema mit Rollen (Admin, Player) und stelle sicher, dass jeder Datenbank-Query eine user_id Validierung enthält."