/**
 * Playwright E2E Tests for Observability Panel, Test Conditions Simulator, and Consent Banner
 * Location: demo/tests/e2e/observability.spec.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Observability & Realism Controls E2E Suite', () => {
  test.beforeEach(async ({ request, page }) => {
    // Reset CRM store before test
    await request.post('/api/dev/reset');
    // Clear localStorage
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
  });

  test('evidence page renders 7 finding packages and switches to telemetry tab', async ({ page }) => {
    await page.goto('/evidence');
    await expect(page).toHaveTitle(/ResponseLock/i);

    // Verify 7 finding cards are rendered
    const findingCards = page.locator('[data-testid^="finding-card-"]');
    await expect(findingCards).toHaveCount(7);

    // Switch to Telemetry & Simulators tab
    await page.getByRole('button', { name: /telemetry & simulators/i }).click();

    // Verify all 3 major components are present
    await expect(page.getByTestId('consent-manager')).toBeVisible();
    await expect(page.getByTestId('test-conditions-panel')).toBeVisible();
    await expect(page.getByTestId('observability-panel')).toBeVisible();
  });

  test('observability panel renders disclaimer, action buttons, and supports manifest download', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/evidence');
    await page.getByRole('button', { name: /telemetry & simulators/i }).click();

    // 1. Mandatory Disclaimer note check
    const disclaimer = page.getByTestId('observability-disclaimer');
    await expect(disclaimer).toBeVisible();
    await expect(disclaimer).toContainText(
      'This observability panel is for local demo introspection and is NOT equivalent to GTM Preview mode or GA4 DebugView.'
    );

    // 2. Action buttons check
    const copyBtn = page.getByTestId('copy-summary-button');
    const downloadBtn = page.getByTestId('download-manifest-button');
    await expect(copyBtn).toBeVisible();
    await expect(downloadBtn).toBeVisible();

    // 3. Test copy button interaction
    await copyBtn.click();
    await expect(copyBtn).toContainText(/copied/i);

    // 4. Test download manifest interaction
    const downloadPromise = page.waitForEvent('download');
    await downloadBtn.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^sanitized-manifest-.*\.json$/);
  });

  test('test conditions panel toggles environmental simulations and shows diagnostic notice', async ({ page }) => {
    await page.goto('/evidence');
    await page.getByRole('button', { name: /telemetry & simulators/i }).click();

    // Initially diagnostic notice is not visible
    await expect(page.getByTestId('adblocker-diagnostic-notice')).toHaveCount(0);

    // Toggle Ad-blocker simulation on
    const adBlockerToggle = page.getByTestId('toggle-adBlocker');
    await adBlockerToggle.check();

    // Diagnostic notice should now appear
    const notice = page.getByTestId('adblocker-diagnostic-notice');
    await expect(notice).toBeVisible();
    await expect(notice).toContainText(/Ad-blocker simulation is ACTIVE/i);

    // Verify window.__RL_TEST_CONDITIONS__ state
    const conditions = await page.evaluate(() => window.__RL_TEST_CONDITIONS__);
    expect(conditions?.adBlocker).toBe(true);

    // Toggle Slow Network simulation on
    const slowNetToggle = page.getByTestId('toggle-slowNetwork');
    await slowNetToggle.check();

    // Active count badge should show 2 active
    await expect(page.getByText('2 active')).toBeVisible();

    // Reset all simulations
    const resetBtn = page.getByRole('button', { name: /reset all simulations/i });
    await resetBtn.click();

    await expect(page.getByTestId('adblocker-diagnostic-notice')).toHaveCount(0);
    await expect(page.getByText('0 active (default)')).toBeVisible();
  });

  test('consent banner updates Consent Mode v2 in dataLayer and reflects choice', async ({ page }) => {
    await page.goto('/evidence');
    await page.getByRole('button', { name: /telemetry & simulators/i }).click();

    // Persistent status should show Default Denied initially
    const statusPill = page.getByTestId('consent-persistent-status');
    await expect(statusPill).toContainText('Default Denied');

    // Click Accept All Tracking (Grant)
    const acceptBtn = page.getByTestId('consent-accept-button');
    await acceptBtn.click();

    // Persistent status should update to Granted
    await expect(statusPill).toContainText('Granted');

    // Verify dataLayer received consent update with granted permissions
    const consentUpdate = await page.evaluate(() => {
      const dl = (window as unknown as { dataLayer: unknown[] }).dataLayer;
      if (!Array.isArray(dl)) return null;

      for (let i = dl.length - 1; i >= 0; i--) {
        const item = dl[i];
        if (
          item &&
          typeof item === 'object' &&
          '0' in item &&
          (item as Record<string, unknown>)[0] === 'consent' &&
          (item as Record<string, unknown>)[1] === 'update'
        ) {
          return (item as Record<string, unknown>)[2];
        }
      }
      return null;
    });

    expect(consentUpdate).toEqual({
      ad_storage: 'granted',
      analytics_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
    });

    // Re-open banner via Manage Consent
    const toggleBannerBtn = page.getByTestId('consent-toggle-button');
    await toggleBannerBtn.click();

    // Click Decline All (Keep Denied)
    const declineBtn = page.getByTestId('consent-decline-button');
    await declineBtn.click();

    // Persistent status should update to Denied
    await expect(statusPill).toContainText('Denied');
  });
});
