---
name: game-economy
description: "Spezialisierter Skill für Entwurf, Modellierung und mathematische Verifikation der Spielökonomie von REALITY CORP: THE AI WORLD TYCOON. Deckt Currency Flows (Sources & Sinks), Multi-Tier-Währungen, Big-Number-Mathematik und Inflationskontrolle ab."
metadata:
  project: REALITY CORP
  version: "1.0.0"
  author: Lead Technical Architect
---

# Game Economy Specification & Engineering

## 1. Zweck
Dieser Skill definiert und kontrolliert alle ökonomischen Ströme, mathematischen Formeln und Währungshierarchien in *REALITY CORP: THE AI WORLD TYCOON*. Er stellt sicher, dass die Spielökonomie frei von unendlichen Exploits, exponentiellen Deadlocks oder Hyperinflationsbrüchen ist.

## 2. Einsatzbedingungen
Lade diesen Skill, wenn:
- Neue Währungen, Ressourcen oder Tokens eingeführt werden (z.B. `$RC_CASH`, `Compute Units [FLOPS]`, `Data Shards`, `Talent Karma`, `Venture Influence`).
- Kostenfunktionen für Gebäude, Hardware-Cluster, AI-Modelle oder Mitarbeiter entworfen oder geändert werden.
- Prestige- bzw. Buyout-Mechaniken modelliert werden.
- Ertragsraten (Production Yields) oder Offline-Einkommensraten berechnet werden.
- Big-Number-Berechnungen (Zahlen über `Number.MAX_SAFE_INTEGER` / `$2^{53}-1$`) implementiert oder refaktoriert werden.

## 3. Arbeitsablauf
1. **Ressourcen-Klassifikation:** Jede Ressource als Primary Source (z.B. API-Abonnements), Secondary Sink (Servermiete, Strom, Mitarbeiter-Gehälter) oder Prestige-Resource (Marktanteil, Tech-IP) klassifizieren.
2. **Formel-Modellierung:** Kostenkurven deterministisch definieren:
   $$\text{Cost}(n) = \text{BaseCost} \times (\text{GrowthRate})^n$$
   wobei $\text{GrowthRate}$ typischerweise zwischen $1.07$ und $1.15$ für Basiseinheiten liegt.
3. **Sink-to-Source Ratio Analyse:** Sicherstellen, dass jede Produktionsstufe einen kontinuierlichen oder zyklischen Sink besitzt, um eine Entwertung früherer Errungenschaften zu verhindern.
4. **Number-Precision-Check:** Bei Werten $> 10^{15}$ immer `Decimal.js` oder `break_infinity.js` Abstraktionen verwenden, niemals native JS `Number` Fließkomma-Additionen für Akkumulationen nutzen.
5. **Simulationslauf:** Verifikation über eine stochastische oder deterministische 24h- / 7-Tage-Simulation (Monte Carlo oder diskrete Zeitschritte).

## 4. Qualitätskriterien
- **Deterministische Reproduzierbarkeit:** Gegebener Seed + dieselben Spieleraktionen = identischer Kontostand.
- **Keine Softlocks:** Der Spieler darf niemals in einen Zustand geraten, in dem das nächste Upgrade rechnerisch unerreichbar wird (Wartezeit $> 48$ Stunden ohne Offline-Ertrag).
- **Graceful Overflow Handling:** Währungsanzeigen müssen einheitliche Suffix-Formatierungen besitzen (K, M, B, T, Qa, Qi, Sx, Sp, Oc, No, Dc bzw. wissenschaftliche Notation $1.23e45$).

## 5. Typische Fehler (Anti-Patterns)
- **Native Floating Point Drift:** Verwendung von `currentCash += delta * yield` mit Standard IEEE-754 Floats, was bei großen Zahlen zu Präzisionsverlust und Rundungs-Glitches führt.
- **Fehlende Sinks:** Spieler häufen Billionen an Währung an, ohne dass es sinnvolle Re-Investitionsmöglichkeiten gibt.
- **Lineare Kosten bei exponentiellem Ertrag:** Führt innerhalb von Spielminuten zum Zusammenbruch der Spielspannung.
- **Unbegrenzte Multiplikatoren:** Multiplikative Stapelung von Buffs ($x \times y \times z$) statt additiver Multiplikator-Gruppen ($x \times (1 + a + b)$).

## 6. Prüfschritte
- [ ] Wurden alle Währungsmutationen über zentrale Transaction-Services ausgeführt?
- [ ] Sind alle Basiskosten und Skalierungsfaktoren in Konfigurationsdateien ausgelagert und nicht hartkodiert?
- [ ] Schlägt ein Unit-Test an, wenn Kosten negativ werden können?
- [ ] Gibt es automatisierte Tests für Grenzfälle ($0$, $1$, $\text{MAX\_SAFE\_INTEGER}$, $\infty$)?

## 7. Konkrete Projektregeln für REALITY CORP
- Alle monetären und rechnerischen Währungen werden im Shared-Types-Paket als strikte Branded Types deklariert (z.B. `type RealityCash = Brand<Decimal, 'RealityCash'>`).
- Keine direkten Mutationen auf dem Player-State ohne Event-Dispatching für das Audit-Log.
- Jede neue Technologie im Forschungsbaum muss eine mathematische Amortisationszeit (Break-Even-Point) zwischen 15 Minuten und 4 Stunden aufweisen.

