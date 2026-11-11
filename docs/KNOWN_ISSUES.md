# KNOWN ISSUES & ENVIRONMENT WARNINGS
**Projekt:** REALITY CORP: THE AI WORLD TYCOON  
**Datum:** 11. November 2026

---

## 1. Aktive Warnungen & Risiken

### ISSUE-01: Begrenzter freier Festplattenspeicher auf Laufwerk C:
- **Schweregrad:** **WARNING**
- **Befund:** Auf Laufwerk `C:` stehen derzeit ca. **25.67 GB** freier Speicherplatz zur Verfügung.
- **Risiko:** Umfangreiche Docker-Base-Images, massive `node_modules`-Ordner oder unbereinigte Build-Artefakte können den Speicherplatz rasch verringern.
- **Gegenmaßnahmen:**
  - Bevorzugung von `pnpm` (zentraler Content-Addressable Storage verhindert redundante Kopien).
  - Verzicht auf unnötig aufgeblähte Dependencies.
  - Regelmäßige Bereinigung temporärer Cache-Verzeichnisse.

### ISSUE-02: Docker Desktop Daemon inaktiv
- **Schweregrad:** **WARNING** / **BLOCKED (nur für containerisierte Dienste)**
- **Befund:** Die Docker-CLI (v29.5.2) ist installiert, jedoch ist der Hintergrunddienst nicht aktiv (`open //./pipe/dockerDesktopLinuxEngine: Das System kann die angegebene Datei nicht finden`). Die WSL2-Instanz `docker-desktop` ist gestoppt.
- **Risiko:** Containerbasierte Services (z.B. Postgres-Container oder Microservice-Container) können im aktuellen Zustand nicht hochgefahren werden.
- **Gegenmaßnahmen:**
  - Für Phase 01–03 nicht zwingend erforderlich (Simulation und Web-Stack können lokal betrieben werden).
  - Sobald Container benötigt werden, muss Docker Desktop in Windows gestartet werden.

### ISSUE-03: `pnpm` fehlt im globalen System-PATH
- **Schweregrad:** **WARNING**
- **Befund:** `pnpm` ist noch nicht global installiert.
- **Gegenmaßnahmen:** Installation über `npm install -g pnpm` oder Corepack nach Benutzerfreigabe in Phase 02.

### ISSUE-04: GitHub CLI (`gh`) nicht installiert
- **Schweregrad:** **INFO**
- **Befund:** Der Befehl `gh` ist auf dem System nicht verfügbar.
- **Gegenmaßnahmen:** Standard-Git CLI funktioniert uneingeschränkt. GitHub-Aktionen können regulär über Standard-Git-Remotes oder das Web-Interface abgewickelt werden.

### ISSUE-05: Neueste Sprachversionen (Node.js v24, Python 3.14)
- **Schweregrad:** **INFO**
- **Befund:** Node.js v24 und Python 3.14 sind sehr aktuelle Versionen.
- **Risiko:** Einige ältere NPM-Pakete mit nativen C++-Builds (node-gyp) könnten Build-Inkompatibilitäten aufweisen.
- **Gegenmaßnahmen:** Bevorzugung moderner, reiner TypeScript/ESM-Pakete und etablierter Bibliotheken.

