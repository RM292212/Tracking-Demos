import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Defect 1 E2E: Premature Conversion Click Trigger', () => {
  test.beforeEach(async ({ request }) => {
    // Reset simulated CRM storage before each test
    const resetRes = await request.post('/api/dev/reset');
    expect(resetRes.status()).toBe(200);
  });

  test('Defect 1 invalid submit fires conversion to dataLayer with 0 API requests and 0 CRM rows @defect-1', async ({
    page,
    request,
  }) => {
    // Intercept network requests to /api/leads to verify 0 network requests
    let leadApiRequestCount = 0;
    await page.route('**/api/leads', async (route) => {
      leadApiRequestCount++;
      await route.continue();
    });

    // 1. Navigate to Defect 1 scenario page
    await page.goto('/scenario/defect-1');
    await expect(page).toHaveTitle(/Defect 1/i);

    // Verify the 4 authoritative verification layer labels are displayed
    await expect(page.getByText('Confirmed locally')).toBeVisible();
    await expect(page.getByText('Requires GTM Preview')).toBeVisible();
    await expect(page.getByText('Requires GA4 DebugView')).toBeVisible();
    await expect(page.getByText('Not tested in Google Ads')).toBeVisible();

    // 2. Click submit button without filling required form fields
    const submitButton = page.getByRole('button', {
      name: /request conversion audit/i,
    });
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // 3. Verify client validation failed and rendered inline error messages
    await expect(
      page.getByText(/full name must be at least 2 characters/i)
    ).toBeVisible();
    await expect(page.getByText(/work email is required/i)).toBeVisible();
    await expect(page.getByText(/company name is required/i)).toBeVisible();

    // 4. Assert zero network requests to /api/leads
    expect(
      leadApiRequestCount,
      'Invalid form submission must make ZERO API requests'
    ).toBe(0);

    // 5. Assert zero CRM records exist in the database
    const crmResponse = await request.get('/api/crm');
    expect(crmResponse.status()).toBe(200);
    const crmData = await crmResponse.json();
    expect(crmData.count, 'Invalid submission must create ZERO CRM rows').toBe(0);

    // 6. Assert success panel is NOT visible
    const successPanel = page.locator('.form-success-panel');
    await expect(successPanel).toHaveCount(0);

    // 7. DEFECT 1 INVARIANT: dataLayer contains EXACTLY 1 conversion event
    const dataLayerEvents = await page.evaluate(() => {
      const dl = (window as unknown as { dataLayer: unknown[] }).dataLayer;
      if (!Array.isArray(dl)) return [];
      return dl.filter(
        (item): item is Record<string, unknown> =>
          item !== null &&
          typeof item === 'object' &&
          (item as Record<string, unknown>)['event'] === 'demo_lead_success'
      );
    });

    expect(
      dataLayerEvents.length,
      'Premature click trigger must have pushed exactly 1 demo_lead_success event'
    ).toBe(1);

    const conversionEvent = dataLayerEvents[0]!;
    expect(conversionEvent['event']).toBe('demo_lead_success');
    expect(conversionEvent['scenario']).toBe('defect-1');
    expect(conversionEvent['form_id']).toBe('lead_audit_demo');
    expect(conversionEvent['lead_type']).toBe('agency_audit_inquiry');
    expect(conversionEvent['debug_mode']).toBe(true);
    expect(typeof conversionEvent['submission_id']).toBe('string');
    expect(conversionEvent['submission_id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    // Ensure ZERO PII in the analytics payload
    const eventKeys = Object.keys(conversionEvent);
    expect(
      eventKeys.every((k) => !k.includes('email') && !k.includes('name'))
    ).toBe(true);

    // Provide observed matrix metrics for dynamic verification matrix emitter
    test.info().annotations.push({
      type: 'metrics',
      description: JSON.stringify({
        successUI: 0,
        crmRows: 0,
        expectedEvents: 1,
      }),
    });
  });

  test('Defect 1 page satisfies accessibility guidelines (axe-core zero serious/critical)', async ({
    page,
  }) => {
    await page.goto('/scenario/defect-1');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('#main-content')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticalOrSerious = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    );

    expect(
      criticalOrSerious,
      `Accessibility violations found: ${JSON.stringify(criticalOrSerious, null, 2)}`
    ).toEqual([]);
  });
});
