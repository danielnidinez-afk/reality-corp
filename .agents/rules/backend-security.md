# Backend Security & Data Protection Governance

## 1. Zero-Trust Datenhaltung & Row-Level Security
- In Supabase / PostgreSQL gilt das Zero-Trust-Prinzip:
  - Jede Tabelle besitzt aktiviertes Row-Level Security (`ALTER TABLE <name> ENABLE ROW LEVEL SECURITY;`).
  - Ohne permissive Policy sind standardmäßig alle Lese- und Schreibzugriffe verboten; explizite Sperr-Policies müssen `AS RESTRICTIVE` verwenden (`USING (false) WITH CHECK (false)`).
  - Zugriff wird ausschließlich über explizite Policies mit Subquery-Wrapping `(SELECT auth.uid())` gewährt:
    ```sql
    CREATE POLICY "Users can only read own profile"
    ON player_profiles FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = id);
    ```
  - Alle `SECURITY DEFINER`-RPCs entziehen `PUBLIC`, `anon` und `authenticated` das Ausführungsrecht (`REVOKE EXECUTE ...`) und gewähren es ausschließlich `service_role`.

## 2. Secrets & Token Hygiene
- **Verbot von Service Keys im Client:** `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_POOLER_URL` oder externe API-Schlüssel dürfen niemals in Git-Commits, `PUBLIC_*`/`VITE_*`-Client-Variablen oder Frontend-Bundles gelangen.
- Öffentliche Clients (`apps/game-client`) dürfen ausschließlich `PUBLIC_SUPABASE_URL` und `PUBLIC_SUPABASE_ANON_KEY` verwenden.
- Alle Secrets müssen über GitHub Repository Secrets oder lokale unversionierte `.env.local`-Dateien (abgeglichen gegen `.env.example`) verwaltet werden.

## 3. Server-Side Validierung & Anti-Cheat
- Alle eingehenden Payloads (Savegame-Uploads, Highscores, Transaktionen) müssen vor der Verarbeitung serverseitig mit Zod validiert werden.
- Timestamp-Plausibilitätsprüfung: Differenzen zwischen letztem Server-Speicherzeitpunkt und Client-Upload müssen mit der maximalen Simulationsproduktionsrate übereinstimmen. Anomale Sprünge markieren den Spielstand als "Unverified" für Ranglisten.

