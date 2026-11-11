# Sicherheitsrichtlinie (SECURITY.md)

Die Sicherheit der Benutzerkonten, des Spielerfortschritts und der Backend-Infrastruktur von **REALITY CORP** hat höchste Priorität.

---

## 1. Unterstützte Versionen

| Version | Unterstützt |
| :--- | :--- |
| `main` Branch | Ja |
| Release-Tags (`v1.x`) | Ja |
| Ältere Entwicklungsstände | Nein |

---

## 2. Melden einer Sicherheitslücke

Wenn du eine Sicherheitslücke (z.B. RLS-Bypass, Injection-Schwachstelle, Client-Side Secret Leak oder Cheating-Vektor) entdeckst:

1. **Nicht öffentlich melden:** Erstelle **kein** öffentliches GitHub-Issue.
2. **Direkter Kontakt:** Sende die vertraulichen Details per E-Mail an den Repository-Inhaber:
   `daniel.nidinez@web.de`
3. **Erforderliche Informationen:**
   - Detaillierte Beschreibung der Schwachstelle
   - Reproduktionsschritte oder Proof-of-Concept (PoC)
   - Betroffene Komponenten (z.B. Supabase Policy, Client Bundle, API Endpoint)
   - Mögliche Auswirkungen

Wir bestätigen den Eingang innerhalb von 48 Stunden und koordinieren die Behebung vor der Veröffentlichung.

---

## 3. Sicherheitsstandards im Repository

- **Zero-Trust Datenbankzugriff:** Jede Tabelle verfügt über Row-Level Security (RLS).
- **Keine Secrets im Git:** Git-Hooks und CI-Scans blockieren Commits mit API-Schlüsseln, Service-Role-Tokens oder Zertifikaten.
- **Client-Sanitization:** Alle externen Nutzlasten werden vor der Verarbeitung strikt serverseitig via Zod validiert.
