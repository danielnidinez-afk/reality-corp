---
name: release-audit
description: "Spezialisierter Skill für Release-Freigaben, Semantic Versioning, Changelogs, Build-Integrität, Lizenz-Compliance und Staging-Verifikation in REALITY CORP."
metadata:
  project: REALITY CORP
  version: "1.0.0"
  author: Lead Technical Architect
---

# Release Audit & Production Readiness Gate

## 1. Zweck
Dieser Skill stellt die letzte Kontrollinstanz vor einem Produktiv-Release (Web-Deployment, App-Store-Upload oder Major Patch) von *REALITY CORP* dar. Er stellt sicher, dass kein instabiler, lizenzrechtlich fragwürdiger oder unvollständiger Build veröffentlicht wird.

## 2. Einsatzbedingungen
Lade diesen Skill, wenn:
- Ein neuer Versions-Release (Patch, Minor, Major) vorbereitet wird.
- Ein Release Candidate (RC) auditiert werden soll.
- Changelogs, Release Notes oder Migrationsskripte verifiziert werden.
- Produktions-Builds (`npm run build`, `capacitor sync`) auf Fehler geprüft werden.

## 3. Arbeitsablauf
1. **Pre-Flight Sanity Check:**
   - Ist das Git-Working-Directory sauber (`git status` ist clean)?
   - Wurden alle unfertigen Feature-Branches gemerged oder hinter Feature-Flags isoliert?
   - Sind alle Umgebungsvariablen für Produktion konfiguriert (Production Endpoints, CDN URLs)?
2. **Automated Verification Pipeline:**
   - Schritt 1: `npm run lint` & `npm run check` (Null Fehler).
   - Schritt 2: `npm run test` (100 % grün).
   - Schritt 3: `npm run build` (Erfolgreicher deterministischer Produktions-Build).
   - Schritt 4: `npm run test:e2e` auf dem gebauten Produktions-Artefakt.
3. **Lizenz- & Dependency-Security-Audit:**
   - Ausführung von `npm audit` (Keine kritischen oder hochgradigen Vulnerabilities).
   - Lizenz-Check aller Third-Party-Pakete: Nur permissive Lizenzen (MIT, Apache 2.0, BSD, ISC). Strikte Ablehnung von AGPL oder unklaren proprietären Lizenzen ohne Freigabe.
4. **Savegame Compatibility Check:**
   - Teste, ob ein Savegame der vorherigen Version (`v(n-1)`) fehlerfrei in die neue Version (`v(n)`) migriert und geladen wird.
5. **Erstellung des Release-Zertifikats:**
   - Dokumentiere Build-Hash, Versionsnummer, Test-Ergebnisse und verifizierte Checkpoints in `docs/releases/`.

## 4. Qualitätskriterien
- **Zero Blocker:** Kein Release wird freigegeben, wenn ein offener Blocker im Issue-Tracker existiert.
- **Savegame-Integrität:** Null Datenverlust für Bestandsspieler.
- **Reproduzierbarer Build:** Derselbe Git-Commit muss auf jedem CI-Runner ein bit-identisches Artefakt erzeugen.

## 5. Typische Fehler (Anti-Patterns)
- **Freitags-Releases:** Release-Veröffentlichung kurz vor dem Wochenende ohne Bereitschaftsteam.
- **Ungetestete Migrationen:** Änderung des Savegame-Formats ohne Abwärtskompatibilitäts-Parser.
- **Debug-Code im Build:** Verbleibende `console.log`-Statements, Debug-Overlay-Buttons oder Test-Guthaben-Cheats im Produktiv-Artefakt.

## 6. Prüfschritte
- [ ] Wurde das `CHANGELOG.md` nach Keep-a-Changelog-Standard aktualisiert?
- [ ] Wurde die Versionsnummer in allen relevanten Dateien (`package.json`, `capacitor.config.ts`, etc.) synchron angehoben?
- [ ] Wurden alle Source-Maps entweder gelöscht oder sicher auf privaten Fehler-Tracking-Servern (z.B. Sentry) hochgeladen?

## 7. Konkrete Projektregeln für REALITY CORP
- Semantic Versioning (`MAJOR.MINOR.PATCH`) ist strikt einzuhalten.
- Jedes offizielle Release-Tag im Git muss signiert oder durch das CI-System generiert sein.
- Ein Release erhält den Status `PRODUCTION READY` erst nach erfolgreichem Volltest aller Kern-Schleifen.

