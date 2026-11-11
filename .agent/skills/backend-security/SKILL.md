---
name: backend-security
description: "Spezialisierter Skill für Authentifizierung, Autorisierung, Row-Level-Security (RLS), Anti-Tampering, API Rate Limiting und Datenschutz in REALITY CORP."
metadata:
  project: REALITY CORP
  version: "1.0.0"
  author: Lead Technical Architect
---

# Backend Security & API Hardening

## 1. Zweck
Dieser Skill schützt das Backend, die Benutzerdaten und die Highscore- / Leaderboard-Integrität von *REALITY CORP*. Er verhindert Cheating, unberechtigte Datenzugriffe, Injection-Angriffe und Denial-of-Service.

## 2. Einsatzbedingungen
Lade diesen Skill, wenn:
- Supabase RLS-Policies (Row-Level Security) erstellt oder editiert werden.
- API-Routen, Server-Actions oder Edge Functions implementiert werden.
- Authentifizierungsabläufe (Magic Links, OAuth, Session Refresh) aufgesetzt werden.
- Spielstands-Synchronisation und Ranglisten gegen Manipulation abgesichert werden.

## 3. Arbeitsablauf
1. **Zero-Trust-Datenbankzugriff (RLS Enforcement):**
   - Jede Tabelle in PostgreSQL / Supabase muss `ENABLE ROW LEVEL SECURITY` aktiviert haben.
   - Standard-Policy ist immer `RESTRICTIVE` oder `DENY ALL`.
   - Explizite Policies für `SELECT`, `INSERT`, `UPDATE`, `DELETE` basierend auf `auth.uid() = user_id`.
2. **Eingabevalidierung & Sanitization:**
   - Jede externe Nutzlast muss serverseitig mit Zod-Schemas validiert werden.
   - Kein rohes SQL: Ausschließlich parametrisierte Queries oder Supabase Query Builder.
3. **Anti-Cheat & Savegame Integrity:**
   - Der Server vertraut niemals blind Client-Berechnungen wie "Ich habe 10 Trillionen Dollar in 1 Sekunde verdient".
   - Plausibilitätsprüfungen beim Hochladen des Spielstands:
     $$\text{DeltaEarning} \le \text{MaxPossibleRate} \times \Delta t \times 1.25$$
   - Bei unplausiblen Sprüngen wird der Spielstand zur manuellen Prüfung markiert (Shadow-Flag) und von öffentlichen Leaderboards ausgeschlossen.
4. **Rate Limiting & Token-Schutz:**
   - Cloudflare- oder Redis-basiertes Rate-Limiting für API-Endpunkte (z.B. max. 60 Anfragen pro Minute pro IP/User).
   - Sensitive Umgebungsvariablen (`SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`) dürfen niemals in Client-Bundles lecken.

## 4. Qualitätskriterien
- **Kein RLS-Bypass:** Öffentliche Clients (`anon key`) haben ausschließlich Zugriff auf ihre eigenen Zeilen oder explizit öffentliche Daten (z.B. globale Leaderboard-Scores).
- **OWASP Top 10 Konformität:** Schutz gegen Injection, Broken Access Control, Security Misconfiguration und Cryptographic Failures.
- **Audit-Trail:** Sicherheitsrelevante Ereignisse (Passwort-Änderungen, anomale Score-Spikes) werden unveränderlich geloggt.

## 5. Typische Fehler (Anti-Patterns)
- **Service Role Key im Frontend:** Verwendung des geheimen Supabase Service Keys im Browser-Code.
- **Fehlende RLS-Aktivierung:** Tabelle angelegt, aber `ALTER TABLE x ENABLE ROW LEVEL SECURITY;` vergessen.
- **Client-Side Auth Verification:** Überprüfung von Benutzerrollen oder Admin-Status rein im JavaScript-Client.

## 6. Prüfschritte
- [ ] Wurden alle RLS-Policies mit Tests für fremde Benutzer (`test_user_b` versucht Daten von `test_user_a` abzufragen) verifiziert?
- [ ] Sind alle Umgebungsvariablen über `.env.example` dokumentiert und keine echten Secrets versioniert?
- [ ] Blockiert die API Payload-Größen $> 1$ MB bei Savegame-Uploads?

## 7. Konkrete Projektregeln für REALITY CORP
- Der `SERVICE_ROLE_KEY` darf ausschließlich in abgesicherten Server-Umgebungen (z.B. Edge Functions oder Backend-Worker) verwendet werden.
- Jede API-Route muss standardmäßig als authentifiziert gelten (`requireAuth()`), außer sie ist explizit als öffentlich deklariert.
- Im Client darf kein Code existieren, der sensible Backend-Strukturen offenbart.

