import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Defect 2 E2E: Duplicate Conversion Tracking Snippet', () => {
  test.beforeEach(async ({ request }) => {
    // Reset simulated CRM storage before each test
    const resetRes = await request.post('/api/dev/reset');
    expect(resetRes.status()).toBe(200);
  });

  test('Defect 2 valid submission produces duplicate conversion events with 1 CRM row @defect-2', async ({
    page,
    request,
  }) => {
    // 1. Navigate to Defect 2 scenario page
    await page.goto('/scenario/defect-2');
    await expect(page).toHaveTitle(/Defect 2/i);

    // Verify the 4 authoritative verification layer labels are displayed
    await expect(page.getByText('Confirmed locally')).toBeVisible();
    await expect(page.getByText('Requires GTM Preview')).toBeVisible();
    await expect(page.getByText('Requires GA4 DebugView')).toBeVisible();
    await expect(page.getByText('Not tested in Google Ads')).toBeVisible();

    // 2. Fill in valid fictional lead information
    await page.getByLabel(/full name/i).fill('Morgan Vance');
    await page.getByLabel(/work email/i).fill('morgan.vance@example.com');
    await page.getByLabel(/company name/i).fill('Vance Marketing Group');
    await page.getByLabel(/phone number/i).fill('+1-555-0142');

    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).not.toBeDisabled();

    // 3. Click submit button
    await submitButton.click();

    // 4. Await success UI panel rendered from server response
    const successPanel = page.locator('.form-success-panel');
    await expect(successPanel).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/1 crm record saved/i)).toBeVisible();

    // 5. Assert exactly 1 CRM record in database (idempotency key protection)
    const crmResponse = await request.get('/api/crm');
    expect(crmResponse.status()).toBe(200);
    const crmData = await crmResponse.json();
    expect(
      crmData.count,
      'Idempotent backend must save exactly 1 CRM record'
    ).toBe(1);

    const savedRecord = crmData.records[0];
    expect(savedRecord.scenario).toBe('defect-2');
    expect(savedRecord.full_name).toBe('Morgan Vance');
    expect(savedRecord.work_email).toBe('morgan.vance@example.com');

    // 6. DEFECT 2 INVARIANT: Exactly 2 conversion events pushed to dataLayer
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
      'Defect 2 must produce exactly 2 demo_lead_success conversion events'
    ).toBe(2);

    const [firstEvent, secondEvent] = dataLayerEvents;
    expect(firstEvent!['event']).toBe('demo_lead_success');
    expect(secondEvent!['event']).toBe('demo_lead_success');
    expect(firstEvent!['scenario']).toBe('defect-2');
    expect(secondEvent!['scenario']).toBe('defect-2');

    // CRUCIAL INVARIANT: Both events share the IDENTICAL submission_id
    expect(
      firstEvent!['submission_id'],
      'Both conversion events must share the identical submission_id'
    ).toBe(secondEvent!['submission_id']);

    // Match with the saved CRM record
    expect(firstEvent!['submission_id']).toBe(savedRecord.submission_id);

    // Ensure ZERO PII in analytics events
    for (const evt of [firstEvent!, secondEvent!]) {
      const keys = Object.keys(evt);
      expect(
        keys.every((k) => !k.includes('email') && !k.includes('name'))
      ).toBe(true);
    }

    // Provide observed matrix metrics for dynamic verification matrix emitter
    test.info().annotations.push({
      type: 'metrics',
      description: JSON.stringify({
        successUI: 1,
        crmRows: 1,
        expectedEvents: 2,
      }),
    });
  });

  test('Defect 2 page satisfies accessibility guidelines (axe-core zero serious/critical)', async ({
    page,
  }) => {
    await page.goto('/scenario/defect-2');

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
