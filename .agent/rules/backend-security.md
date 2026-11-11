# Backend Security & Data Protection Governance

## 1. Zero-Trust Datenhaltung & Row-Level Security
- In Supabase / PostgreSQL gilt das Zero-Trust-Prinzip:
  - Jede Tabelle besitzt aktiviertes Row-Level Security (`ALTER TABLE <name> ENABLE ROW LEVEL SECURITY;`).
  - Standardmäßig sind alle Lese- und Schreibzugriffe verboten (`FOR ALL USING (false)`).
  - Zugriff wird ausschließlich über explizite Policies gewährt:
    ```sql
    CREATE POLICY "Users can only read own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);
    ```

## 2. Secrets & Token Hygiene
- **Verbot von Service Keys im Client:** `SUPABASE_SERVICE_ROLE_KEY`, Datenbank-Passwörter oder externe API-Schlüssel dürfen niemals in `.env`, Frontend-Bundles oder Git-Commits gelangen.
- Öffentliche Clients dürfen ausschließlich den `anon`-Key verwenden.
- Alle Secrets müssen über GitHub Repository Secrets oder lokale unversionierte `.env.local` verwaltet werden.

## 3. Server-Side Validierung & Anti-Cheat
- Alle eingehenden Payloads (Savegame-Uploads, Highscores, Transaktionen) müssen vor der Verarbeitung serverseitig mit Zod validiert werden.
- Timestamp-Plausibilitätsprüfung: Differenzen zwischen letztem Server-Speicherzeitpunkt und Client-Upload müssen mit der maximalen Simulationsproduktionsrate übereinstimmen. Anomale Sprünge markieren den Spielstand als "Unverified" für Ranglisten.
