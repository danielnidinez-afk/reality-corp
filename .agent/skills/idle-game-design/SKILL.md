---
name: idle-game-design
description: "Spezialisierter Skill für Mechaniken, UX-Muster, Offline-Fortschrittsberechnung und Session-Loops in Idle- & Incremental-Games für REALITY CORP."
metadata:
  project: REALITY CORP
  version: "1.0.0"
  author: Lead Technical Architect
---

# Idle Game Design & Architecture

## 1. Zweck
Dieser Skill regelt die typischen Kernmuster moderner Incremental- und Idle-Spiele. Er sorgt für eine reibungslose State-Serialisierung, präzise Offline-Simulation ohne Serverüberlastung und psychologisch motivierende Session-Rhythmen.

## 2. Einsatzbedingungen
Lade diesen Skill, wenn:
- Offline-Progression (Berechnung von Erträgen bei geschlossener App) entworfen oder repariert wird.
- Time-Skip-, Catch-Up- oder Replay-Mechanismen implementiert werden.
- Automatisierungs-Nodes (Manager, Autoclicker, Batch-Purchaser) integriert werden.
- UX-Muster wie "Buy Max", "Buy 10x/100x", "Bulk Upgrade" oder "Foldable System Panels" gebaut werden.

## 3. Arbeitsablauf
1. **Offline-Einkommens-Algorithmus:**
   - Berechne Zeitdifferenz: $\Delta t = \min(\text{CurrentTime} - \text{LastSaveTime}, \text{MaxOfflineCap})$.
   - Simuliere je nach Komplexität der Abhängigkeiten:
     - *Konstanter Durchsatz:* Direkte mathematische Multiplikation ($\Delta t \times \text{Rate}$).
     - *Verkettete Dynamiken (A produziert B, B produziert C):* Analytische Integration über Taylor-Polynom oder Chunking in $N$ diskrete Makro-Ticks (z.B. 100 Schritte maximal), um Browser-Blockaden beim Starten zu verhindern.
2. **Offline-Modal UX:**
   - Präsentiere dem Spieler beim erneuten Öffnen ein klares "Welcome Back!"-Modal mit exakter Auflistung der verdienten Ressourcen und optionalen Boosts.
3. **Savegame-Architektur:**
   - Regelmäßiges Auto-Save (z.B. alle 30 Sekunden) in `IndexedDB` / `localStorage` + atomares Backup.
   - Integritäts-Prüfsumme (HMAC oder Hash), um versehentliche Dateikorruption zu erkennen.

## 4. Qualitätskriterien
- **Sofortiger Kaltstart:** Die App muss innerhalb von $< 1.5$ Sekunden interaktiv sein, selbst wenn 30 Tage Offline-Zeit nachberechnet werden müssen.
- **Batterieschonung:** Bei Minimierung des Fensters (`visibilitychange` Event) muss der aktive Render-Loop pausieren und auf einen 1-Hz-Hintergrund-Timer drosseln.
- **Anti-Cheat bei Zeitmanipulation:** Erkennung von Systemzeit-Rückstellung (Clock Tampering). Wenn $\text{CurrentTime} < \text{LastSaveTime}$, darf keine Zeitdifferenz gutgeschrieben werden.

## 5. Typische Fehler (Anti-Patterns)
- **CPU-Blockierendes Tick-Spamming:** Iteratives Ausführen von Millionen Ticks in einer synchronen `while`-Schleife beim Kaltstart, was zum Einfrieren der Benutzeroberfläche führt.
- **Savegame Loss:** Überschreiben des Speicherstands im Fehlerfall mit einem leeren Default-State.
- **Fehlende UI-Reaktionsanzeige:** Unklare Rückmeldung bei Klicks auf Deaktiviert-Zustände von Upgrades.

## 6. Prüfschritte
- [ ] Wurde das Verhalten bei Flugmodus / Offline-Start getestet?
- [ ] Funktioniert der "Buy Max"-Button mathematisch exakt mit logarithmischer Summenformel $\sum_{k=0}^{m-1} b \cdot r^{n+k}$?
- [ ] Ist der maximale Offline-Zeitraum (`MaxOfflineCap`) konfigurierbar (z.B. standardmäßig 8 Stunden, erweiterbar durch Tech-Upgrades)?

## 7. Konkrete Projektregeln für REALITY CORP
- Das Spiel muss vollständig offline lauffähig sein; Cloud-Sync ist ein optionaler, nicht-blockierender Bonus.
- Savegames werden versioniert und migrationssicher gespeichert (`schemaVersion: number` in jedem Spielstand).
- Beim Auftreten eines korrupten Spielstands wird das automatische Backup `.bak` wiederhergestellt und der Vorfall geloggt.

