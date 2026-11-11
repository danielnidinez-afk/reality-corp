---
name: game-balancing
description: "Spezialisierter Skill für Pacing, Progressionskurven, Playtime-Modellierung und Schwierigkeitsstufen in REALITY CORP: THE AI WORLD TYCOON. Garantiert kontinuierliche Dopamin-Loops und planbare Session-Längen."
metadata:
  project: REALITY CORP
  version: "1.0.0"
  author: Lead Technical Architect
---

# Game Balancing & Progression Engineering

## 1. Zweck
Dieser Skill steuert das Pacing, die zeitliche Staffelung von Belohnungen, die Freischaltung neuer Spielsysteme und die Balance zwischen aktiver Spielzeit (Tapping, Micro-Management) und passiver Spielzeit (Idle, Offline-Progress).

## 2. Einsatzbedingungen
Lade diesen Skill, wenn:
- Neue Meilensteine, Kapitel oder Zeitalter (z.B. "Garage Startup", "Series A Datacenter", "Global AI Monopoly", "Planetary Singularity") ausbalanciert werden.
- Die Zeitspanne bis zum nächsten Unlock (Time to Next Milestone - TTNM) justiert wird.
- Multiplikatoren für Prestige-Resets ("IPO / Hard Fork / Singularity Awakening") berechnet werden.
- Spieler-Feedback bzgl. "zu langsam", "zu langweilig" oder "viel zu schnell durchgespielt" analysiert wird.

## 3. Arbeitsablauf
1. **Target TTNM Mapping:** Zeitfenster für Kernphasen definieren:
   - Erste 60 Sekunden: Unmittelbares Feedback, 3+ Upgrades, klares Ziel.
   - Erste 10 Minuten: Erste Automatisierungsstufe (z.B. "Junior AI Dev Bot").
   - 1 Stunde: Erster Prestige-Loop (Börsengang / Buyout).
   - 24 Stunden: Multi-System-Komplexität (GPU-Cluster, Stromnetze, Modell-Training).
2. **Prestige-Formel-Validierung:**
   $$\text{PrestigeTokens} = \text{floor}\left( \text{ScaleFactor} \times \sqrt{\frac{\text{LifetimeEarnings}}{\text{Threshold}}} \right)$$
   Quadratwurzel- oder Kubikwurzel-Skalierung bevorzugen, um lineares oder exponentielles Explodieren der Prestige-Tokens zu zügeln.
3. **Pacing Curves:** Kurvenverlauf grafisch oder tabellarisch abbilden (Idle-Plateau vs. Burst-Phasen).
4. **Headless Speed-Run Automation:** Den Balancing-Test mit einem virtuellen Bot durchführen, der immer die mathematisch optimale Kaufentscheidung trifft (`greedy_ai_benchmark.ts`).

## 4. Qualitätskriterien
- **Dopamin-Kadenz:** In den ersten 15 Spielminuten darf keine Wartezeit ohne aktive Aktion länger als 45 Sekunden andauern.
- **Prestige-Relevanz:** Jeder Prestige-Reset muss eine spürbare Beschleunigung von mindestens Faktor $2.5\times$ auf die vorherige Stufe bringen.
- **Echte Entscheidungsfreiheit:** Mindestens zwei divergente Pfade müssen in jeder Spielphase wettbewerbsfähig sein (z.B. "Open Source AI Swarm" vs. "Proprietary Sovereign Model").

## 5. Typische Fehler (Anti-Patterns)
- **Die endlose Wand (The Wall):** Exponentielle Kostensteigerung ohne korrespondierende Freischaltung neuer Synergien, wodurch der Spielfluss abrupt einfriert.
- **Boring Micro-Clicking:** Zwang zum monotonen Dauerklicken ohne rasche Automatisierungsoptionen.
- **Dominante Strategie:** Ein einziger Gebäudetyp oder Upgrade-Pfad ist mathematisch so überlegen, dass 90 % der Spielmechaniken irrelevant werden.

## 6. Prüfschritte
- [ ] Wurde das Balancing über automatisierte Bot-Simulationen für $10^4$ simulierte Sekunden getestet?
- [ ] Bleibt die Framerate und Tick-Laufzeit stabil bei maximaler Zahl von Entitäten?
- [ ] Sind alle Balancing-Parameter zentral in JSON/YAML hinterlegt und ohne Code-Rebuild hot-reloadable?

## 7. Konkrete Projektregeln für REALITY CORP
- Alle Balancing-Variablen müssen in `configs/balancing/` versioniert werden.
- Zu jedem Patch mit Balancing-Änderungen gehört ein Delta-Chart (vorher/nachher TTNM).
- Keine Pay-to-Win-Eingriffe in die fundamentale Core-Balance.

