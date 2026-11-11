# Game Economy & Mathematical Balance Rules

## 1. Währungs- und Ressourcen-Architektur
Die Ökonomie von *REALITY CORP* umfasst fünf Schichten:
1. **Liquid Cash (`$RC`):** Primäre Betriebs- und Investitionswährung (Generiert durch API-, Cloud- und Kunden-Monetarisierung).
2. **Compute (`FLOP/s` & `Compute Cycles`):** Rechenleistung für AI-Workflows und Training.
3. **Energy (`kW`):** Kapazitätsgrenze (Supply vs. Demand); Unterversorgung drosselt Erträge über Load-Faktor $\eta \le 1.0$.
4. **Data (`Data Shards`):** Forschungs- und Trainingsressource (Sink für Research Tree).
5. **Prestige-Währung (`Equity Shares` in Apex Syndicate):** Dauerhafte Meta-Währung durch Soft-Resets.

## 2. Mathematische Gesetze
- **Kosten-Skalierung:**
  $$\text{Cost}(L) = \left\lceil \text{BaseCost} \times (\text{Multiplier})^L \right\rceil$$
  wobei Multiplier zwischen $1.07$ (Basiseinheiten) und $1.15$ (Spitzen-Technologie) liegt.
- **Ertrags-Skalierung:**
  $$\text{Yield}(L) = \text{BaseYield} \times L \times \eta \times \prod \text{MilestoneMultipliers}$$
  Meilenstein-Boni verdoppeln oder vervierfachen den Ertrag bei Level 25, 50, 100, 250, 500, 1000.
- **Big-Number-Pflicht (DEC-04):**
  Für alle progressiven Ressourcen ist zwingend `break_infinity.js` gekapselt hinter dem `BigVal`-Adapter (`packages/economy-engine`) zu verwenden (Speicherformat `{ m, e }`). Direkte Float-Berechnungen mit JS `number` oder langsames `decimal.js` im Tick-Loop sind verboten.

## 3. Sinks & Inflationsschutz
- Jedes Einkommen muss durch proportionale laufende Kosten (Mitarbeitergehälter, Kühlung, Servermiete) und zyklische Re-Investitionen ausbalanciert sein.
- Soft-Caps und abflachende Grenzerträge verhindern das unendliche Anhäufen toter Währungsberge ohne Spielziel.

