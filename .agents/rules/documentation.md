# Documentation & Decision Records (ADR)

## 1. Dokumentations-Pflicht
- Jeder neue Service, jedes Subsystem und jeder mathematische Algorithmus muss in `docs/` dokumentiert sein.
- Alle öffentlichen TypeScript-Schnittstellen müssen mit TSDoc-Kommentaren versehen werden.

## 2. Architecture Decision Records (ADRs)
- Grundsatzentscheidungen werden unter `docs/decisions/` im Format `ADR-XXXX-<titel>.md` abgelegt:
  - Kontext & Problemstellung
  - Bewertete Optionen
  - Getroffene Entscheidung mit Begründung
  - Konsequenzen (Vor- und Nachteile)

## 3. Lebendige Dokumentation
- Dokumente müssen mit Codeänderungen synchron aktualisiert werden. Veraltete Dokumentation gilt als technischer Mangel.
- Keine sensiblen Schlüssel oder internen Netzwerk-Tokens in Dokumenten.

