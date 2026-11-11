---
name: database-design
description: "Spezialisierter Skill für PostgreSQL- und Supabase-Schemadesign, Normalisierung, Migrationen, JSONB-Partitionierung, Indizierung und Performance in REALITY CORP."
metadata:
  project: REALITY CORP
  version: "1.0.0"
  author: Lead Technical Architect
---

# Database Schema & Performance Engineering

## 1. Zweck
Dieser Skill regelt den Aufbau, die Normalisierung und die Performanz der PostgreSQL- und Supabase-Datenbanken für *REALITY CORP*. Er stellt sicher, dass Benutzerprofile, Spielstände, Welt-Zustände und Telemetriedaten konsistent und mit minimaler Latenz gespeichert werden.

## 2. Einsatzbedingungen
Lade diesen Skill, wenn:
- Neue Tabellen, Enums, Views oder Fremdschlüssel definiert werden.
- SQL-Migrationen geschrieben oder declarative Schemata angelegt werden.
- Abfragen optimiert werden müssen (EXPLAIN / ANALYZE, Index-Tuning).
- Hybrid-Strukturen (relationale Tabellen kombiniert mit JSONB für komplexe Spielzustände) entworfen werden.

## 3. Arbeitsablauf
1. **Schema-Architektur & Normalisierung:**
   - Kernentitäten (Benutzer, Spielstand-Metadaten, Leaderboard-Einträge, Transaktionen) relational modellieren (3. Normalform).
   - Hochdynamische Simulationsdaten (z.B. detaillierter Forschungsbaum, individuelle Mitarbeiter-Stats im Tycoon) pragmatisch in validierten `jsonb`-Spalten kapseln, um ständige Tabellen-Migrationen bei Balancing-Patches zu vermeiden.
2. **Primärschlüssel & Datentypen:**
   - Standard-Primärschlüssel: `uuid DEFAULT gen_random_uuid()`.
   - Zeitstempel: Immer `timestamptz DEFAULT now()`.
   - Währungen / Geldbeträge: `numeric` für präzise Werte oder `jsonb` für astronomische Idle-Game-Werte (z.B. `{ mantissa: 1.45, exponent: 120 }`).
3. **Indizierungsstrategie:**
   - Fremdschlüssel (`REFERENCES`) immer mit einem Index versehen (`CREATE INDEX idx_... ON ...`).
   - Häufig gefilterte Kombinationen (z.B. `user_id` + `created_at DESC`) mit Composite-Indizes abdecken.
   - GIN-Indizes auf JSONB-Spalten nur gezielt setzen, wenn Suchabfragen innerhalb der JSON-Struktur erforderlich sind.
4. **Migrationen-Management:**
   - Jede Schemaänderung muss über versionierte SQL-Migrationsdateien erfolgen (`supabase/migrations/<timestamp>_<name>.sql`).
   - Migrationen müssen idempotent und rückrollbar (Up/Down) konzipiert sein.

## 4. Qualitätskriterien
- **Abfrage-Latenz:** 95 % aller Datenbankabfragen müssen in $< 20$ ms beantwortet werden.
- **Transaktions-Sicherheit:** Geldbetragstransaktionen oder In-Game-Käufe müssen in strikten ACID-Transaktionen mit `BEGIN ... COMMIT` gekapselt sein.
- **Connection Health:** Nutzung von Supavisor / Connection Pooling, um Erschöpfung des Verbindungspools zu verhindern.

## 5. Typische Fehler (Anti-Patterns)
- **N+1 Query Problem:** Schleifen über Entitäten mit einzelnen SQL-Queries statt `JOIN` oder Batch-Abfragen.
- **Fehlende Indizes auf Fremdschlüsseln:** Führt bei Kaskadierungs- oder Join-Operationen zu teuren Sequential Scans.
- **Unbegrenzte JSONB-Ausdehnung:** Speichern von Megabyte-großen Audit-Logs in einer einzigen unstrukturierten Zeile.

## 6. Prüfschritte
- [ ] Zeigt `EXPLAIN (ANALYZE, BUFFERS)` Sequential Scans auf großen Tabellen?
- [ ] Sind alle Tabellennamen im Plural und kleingeschrieben (`profiles`, `game_saves`, `leaderboards`)?
- [ ] Werden Foreign Keys mit `ON DELETE CASCADE` oder `ON DELETE SET NULL` bewusst definiert?

## 7. Konkrete Projektregeln für REALITY CORP
- `game_saves` speichert nur den aktuellen Zustand und die letzten 3 Snapshot-Backups pro Spieler.
- Leaderboard-Abfragen werden gecached oder über materialisierte Views mit periodischem Refresh aktualisiert.
- Keine Datenbankzugriffe mit Wildcard-Selects (`SELECT *`); immer explizite Spaltenlisten deklarieren.

