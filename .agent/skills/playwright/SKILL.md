---
name: playwright
description: "Experten-Skill für End-to-End-Testing (E2E), Browser-Automatisierung, Visual Regression Tests und resiliente Web-Interaktion mit Playwright."
metadata:
  version: "1.50.0"
  license: Apache-2.0
---

# Playwright End-to-End Testing Standards

## 1. Zweck
Dieser Skill definiert die Richtlinien für zuverlässige, wartbare und fehlerresistente Browser-Tests von Spieloberflächen, Formularen und Benutzer-Flows.

## 2. Best Practices für Locators & Assertions

### 2.1 User-First Locator-Strategie
Wähle Elemente immer so aus, wie ein menschlicher Benutzer oder Screenreader sie wahrnimmt:
1. `page.getByRole('button', { name: 'Forschung starten' })`
2. `page.getByText('Server Cluster Level 5')`
3. `page.getByLabel('Rechenleistung Limit')`
4. `page.getByTestId('tycoon-balance-display')` (nur wenn semantische Rollen nicht ausreichen)

**Niemals verwenden:**
- Zerbrechliche CSS-Ketten: `page.locator('div.container > div:nth-child(2) > span')`
- XPath: `page.locator('//button[@class="btn"]')`

### 2.2 Web-First Assertions
Verwende immer asynchrone, selbst-wartende Assertions (`expect(locator).to...`):
```typescript
// Richtig: Wartet automatisch bis das Element erscheint und den Wert annimmt
await expect(page.getByTestId('cash-counter')).toContainText('$1,000');

// Falsch: Erzeugt Flakiness bei leichten Latenzen
const text = await page.getByTestId('cash-counter').innerText();
expect(text).toBe('$1,000');
```

## 3. Typische Fehler & Anti-Patterns
- **`page.waitForTimeout(3000)`:** Künstliche Pausen machen Testsuiten langsam und unzuverlässig. Verwende immer Zustands-Assertions (`toBeVisible()`, `toHaveCount()`).
- **Test-Interdependenz:** Tests dürfen nicht voneinander abhängen. Jeder Test muss mit einem frischen Kontext oder definierten Seed starten.

