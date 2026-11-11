# MODEL CONTEXT PROTOCOL (MCP) REGISTRY & SECURITY AUDIT
**Projekt:** REALITY CORP: THE AI WORLD TYCOON  
**Datum:** 11. November 2026  
**Auditor:** Chief Technical Architect

---

## 1. Übersicht & Sicherheitskriterien für MCP-Server

MCP-Server erweitern die Fähigkeiten von Google Antigravity um externe Werkzeuge. Um Datensicherheit und Integrität zu gewährleisten, gelten folgende Kriterien:
1. **Herkunftsnachweis:** Nur offizielle Hersteller- oder offiziell auditierte MCP-Pakete.
2. **Prinzip der minimalen Rechte (Least Privilege):** Keine weitreichenden System- oder Root-Berechtigungen.
3. **Schutz privater Daten:** Kein Server darf ohne explizite Filterung Zugriff auf Benutzer-Home-Verzeichnisse oder unbeteiligte Repositories erhalten.
4. **Keine verdeckten Binaries:** Transparente Protokolle über Stdio oder SSE.

---

## 2. Detaillierte Evaluierung der 9 Domänen

| Domäne | Empfohlener Server | Herkunft / Paket | Berechtigungen | Nutzen für REALITY CORP | Sicherheitsbewertung | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GitHub** | GitHub MCP Server | `@modelcontextprotocol/server-github` | Scoped GitHub PAT (nur `reality-corp`) | Automatisierte PR-Erstellung, Issue-Tracking | **Sicher** bei Beschränkung auf das Projekt-Repo | **EMPFOHLEN (Zur Freigabe)** |
| **Dateisystem** | *Native Antigravity Tools* | Antigravity Built-in (`read_file`, `write_file`) | Scoped auf `REALITY-CORP` | Vollständige Dateiverwaltung | **Höchste Sicherheit** (Kein externer MCP nötig) | **NATIV AKTIV** |
| **Browser / E2E** | Puppeteer MCP | Antigravity Built-in (`mcp/puppeteer`) | Lokaler Headless Chromium | UI-Rendering-Tests, Klick-Simulation | **Sicher**, da isolierte Sandbox | **AKTIV** |
| **Playwright E2E**| Playwright MCP | `@executeautomation/playwright-mcp-server` | Lokaler Browser-Prozess | Komplexe Multi-Tab- & Mobile-Emulation | **Sicher** | **OPTIONAL (Ergänzung)** |
| **Supabase** | Supabase MCP | Offizielles Supabase Plugin | Supabase Management API Key | Schemaprüfung, RLS-Audit, Migrationen | **Sehr sicher** mit Projekt-Token | **EMPFOHLEN (Zur Freigabe)** |
| **PostgreSQL** | Postgres MCP | `@modelcontextprotocol/server-postgres` | PostgreSQL Connection String | Lokale SQL-Inspektion & Explain-Pläne | **Vorsicht**: Nur für lokales Test-Postgres | **BEVORZUGT VIA SUPABASE** |
| **Doku-Recherche**| Native Web Search / Docs| Antigravity (`search_web`, `search_marketplace`)| HTTP GET | Recherche aktueller Svelte 5 / Pixi v8 Docs | **Sehr sicher** (Read-Only) | **NATIV AKTIV** |
| **Design & UI** | Figma MCP | Offizielles Figma Plugin (Marketplace) | Figma Read-Only Access Token | Übernahme von UI-Tokens und Asset-Vektoren | **Sicher** | **OPTIONAL** |
| **Fehleranalyse** | REA (Reverse Engineering) | Antigravity Built-in (`mcp/rea`) | Lokale Prozess- / Binary-Analyse | Call-Graph, Crash-Dumps, Heap-Analyse | **Sehr sicher** | **AKTIV** |

---

## 3. Aktuell verfügbare & aktive MCP-Server im System

Im lokalen Antigravity-Profil sind folgende Server bereits registriert:
1. **`puppeteer`:** Voll einsatzbereit für visuelle Tests, DOM-Inspektion und Klick-Automatisierung.
2. **`rea`:** Bereit für Deep Memory Profiling, Crash-Dumps und Trace-Analysen.
3. **`unity` / `unity-editor` / `ai-game-developer`:** Bereit für 3D/Engine-Aufgaben.

---

## 4. Richtlinien für Neuinstallationen
- Externe MCP-Server werden erst nach Vorlage des Tokens und Freigabe durch den Benutzer aktiviert.
- Für Supabase wird das offizielle `antigravity-plugins-partners/plugin/supabase` empfohlen, sobald das Supabase-Projekt angelegt ist.
