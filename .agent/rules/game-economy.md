# Game Economy & Mathematical Balance Rules

## 1. Währungs- und Ressourcen-Architektur
Die Ökonomie von *REALITY CORP* umfasst vier Schichten:
1. **Liquid Cash (`$RC`):** Primäre Betriebs- und Investitionswährung (Generiert durch Kunden, API-Verkäufe, Aufträge).
2. **Compute & Energy (`FLOP/s` & `kW/h`):** Physikalische Ressourcen zur Ausführung und zum Training von KI-Modellen.
3. **Intellectual Property (`Tech Karma` / `Patents`):** Nicht-inflationäre Forschungsressource für dauerhafte Boosts.
4. **Market Valuation & Influence (`IPO Points` / `Singularity Shards`):** Prestige-Währung, die erst durch Buyouts oder Resets freigeschaltet wird.

## 2. Mathematische Gesetze
- **Kosten-Skalierung:**
  $$\text{Cost}(L) = \text{BaseCost} \times (\text{Multiplier})^L$$
  wobei Multiplier zwischen $1.07$ (Basiseinheiten) und $1.15$ (Spitzen-Technologie) liegt.
- **Ertrags-Skalierung:**
  $$\text{Yield}(L) = \text{BaseYield} \times L \times \prod \text{MilestoneMultipliers}$$
  Meilenstein-Boni verdoppeln oder vervierfachen den Ertrag bei Level 25, 50, 100, 250, 500, 1000.
- **Big-Number-Pflicht:**
  Ab Zahlen über $10^{15}$ (`Number.MAX_SAFE_INTEGER`) ist zwingend `Decimal.js` oder `break_infinity.js` zu verwenden. Direkte Float-Berechnungen mit JS `number` für progressive Summen sind verboten.

## 3. Sinks & Inflationsschutz
- Jedes Einkommen muss durch proportionale laufende Kosten (Mitarbeitergehälter, Kühlung, Servermiete) und zyklische Re-Investitionen ausbalanciert sein.
- Soft-Caps und abflachende Grenzerträge verhindern das unendliche Anhäufen toter Währungsberge ohne Spielziel.
