import { expect, test } from '@playwright/test';

test.describe('REALITY CORP Tycoon MVP Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('lädt die Spieloberfläche mit Header, APEX SYNDICATE und Cluster-HUD', async ({ page }) => {
    // 1. Web-first Assertions auf den Header
    await expect(page.getByRole('heading', { level: 1 })).toContainText('REALITY CORP');
    await expect(page.getByText('APEX SYNDICATE', { exact: true })).toBeVisible();

    // 2. Sound-Toggle testen (standardmäßig aktiv: Button bietet "Ton ausschalten" an)
    const soundBtn = page.getByRole('button', { name: /Ton ausschalten/i });
    await expect(soundBtn).toBeVisible();
    await soundBtn.click();
    await expect(page.getByRole('button', { name: /Ton einschalten/i })).toBeVisible();

    // 3. Manueller Compute-Tap (geprüft via barrierefreiem Namen / aria-label)
    const tapBtn = page.getByRole('button', { name: /Compute Cluster manuell takten/i });
    await expect(tapBtn).toBeVisible();
    await tapBtn.click();
  });

  test('Navigation zwischen den Bereichen Cluster, R&D, Focus und Welten funktioniert', async ({ page, isMobile }) => {
    // Navigiere zu R&D / AI
    const rndBtn = isMobile
      ? page.getByRole('navigation', { name: 'Mobile Thumb Navigation' }).getByRole('button', { name: 'R&D / AI' })
      : page.getByRole('navigation', { name: 'Desktop Navigation' }).getByRole('button', { name: 'R&D / AI' });
    await rndBtn.click();
    await expect(page.getByText('Forschungsbaum')).toBeVisible();

    // Navigiere zu Focus & IPO
    const focusBtn = isMobile
      ? page.getByRole('navigation', { name: 'Mobile Thumb Navigation' }).getByRole('button', { name: 'Focus & IPO' })
      : page.getByRole('navigation', { name: 'Desktop Navigation' }).getByRole('button', { name: 'Focus & IPO' });
    await focusBtn.click();
    await expect(page.getByText('Deep-Focus-Timer')).toBeVisible();

    // Navigiere zu Welten
    const worldsBtn = isMobile
      ? page.getByRole('navigation', { name: 'Mobile Thumb Navigation' }).getByRole('button', { name: 'Welten' })
      : page.getByRole('navigation', { name: 'Desktop Navigation' }).getByRole('button', { name: 'Welten' });
    await worldsBtn.click();
    await expect(page.getByText('Chrono Forge')).toBeVisible();
    await expect(page.getByText('Sovereign Island')).toBeVisible();
  });
});
