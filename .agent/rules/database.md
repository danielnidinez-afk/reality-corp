# Database Architecture & Performance Governance

## 1. Schema-Design & Tabellenregeln
- Tabellennamen im Plural, klein und mit Snake-Case (z.B. `player_profiles`, `game_snapshots`, `leaderboard_entries`).
- Primärschlüssel sind standardmäßig UUIDs:
  `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- Zeitstempel immer mit Zeitzone:
  `created_at timestamptz NOT NULL DEFAULT now()`, `updated_at timestamptz NOT NULL DEFAULT now()`

## 2. Hybrid-Speicherung (Relational + JSONB)
- Feste, suchbare Metadaten (Spieler-ID, Nickname, Level, Prestige-Count, Score) werden strikt relational und indiziert gespeichert.
- Hochgradig verschachtelte Simulationszustände (z.B. 100 individuelle GPU-Racks, komplexe Tech-Node-Stati) werden in einer typisierten `state jsonb` Spalte abgelegt.
- Dadurch bleiben Balancing-Patches migrationsfrei für Bestandsdaten, solange die Zod-Deserialisierung migrationsfähig ist.

## 3. Indizierungs- und Performance-Richtlinien
- Jeder Fremdschlüssel (`FOREIGN KEY`) muss zwingend mit einem Index versehen werden.
- Häufig abgefragte Sortierungen (z.B. Leaderboard nach Score) erfordern Composite B-Tree-Indizes:
  `CREATE INDEX idx_leaderboards_score ON leaderboard_entries (season_id, score DESC);`
- Keine Wildcard-Selects (`SELECT *`) in Produktiv-Queries; immer explizite Spalten deklarieren.
- Alle Migrationen müssen in `supabase/migrations/` mit ISO-Zeitstempel versioniert und idempotent sein.
