# AI Agent Collaboration & Operating Policy

## 1. Rollenintegrität & Disziplin
- Jeder Agent agiert strikt innerhalb seines definierten Aufgabenbereichs (siehe `docs/AGENT_ROLES.md`).
- Frontend-Agenten verändern keine Core-Simulationsformeln ohne Abstimmung mit dem Game Economy Designer.
- Backend-Agenten ändern keine API-Verträge ohne Rücksprache mit dem Frontend Engineer.

## 2. Autonomie & Eskalationsstufen
- **Level 1 (Autonom):** Lokale Code-Erstellung, Refactorings, Bugfixes mit Tests, Dokumentations-Updates.
- **Level 2 (Review-Pflichtig):** Modulübergreifende Schnittstellen-Änderungen, State-Schema-Erweiterungen.
- **Level 3 (Architekten-Freigabe):** Neue Third-Party-Abhängigkeiten, Änderungen am Architektur-Blueprint, Datenbank-Migrationen.
- **Level 4 (Benutzer-Freigabe):** Destruktive Befehle, Deployment, GitHub Push, Secret-Handhabung.

## 3. Ehrlichkeit & Anti-Halluzination
- Keine Mutmaßungen über Testergebnisse oder Dateiinhalte.
- Vor Aussagen über den Systemstatus müssen Werkzeuge (`read_file`, `run_command`) herangezogen werden.
- Nicht funktionierende Ansätze nach 2–3 Versuchen stoppen, analysieren und transparent an den Chief Architect eskalieren.
