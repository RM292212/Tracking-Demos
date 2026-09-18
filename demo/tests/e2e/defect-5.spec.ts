import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Defect 5 E2E Suite: SPA Client Navigation Dropping Query String Attribution', () => {
  test.beforeEach(async ({ request }) => {
    // Dev reset ensures clean state before each test run
    const resetRes = await request.post('/api/dev/reset');
    expect(resetRes.status()).toBe(200);
  });

  test('captures entry attribution from URL, strips query on Step 2 navigation, and submits with dropped status', async ({
    page,
    request,
  }) => {
    const landingUrl =
      '/scenario/defect-5?utm_source=google&utm_medium=cpc&utm_campaign=responselock_demo&gclid=DEMO-GCLID-001';

    // 1. User lands on Defect 5 page via Google Ads paid media link
    await page.goto(landingUrl);

    // Verify 4 verification layer labels
    const labels = [
      'Confirmed locally',
      'Requires GTM Preview',
      'Requires GA4 DebugView',
      'Not tested in Google Ads',
    ];
    for (const label of labels) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }

    // Verify inspection panel displays entry parameters
    const entryPanel = page.locator('[data-testid="inspection-at-entry"]');
    await expect(entryPanel).toContainText('google');
    await expect(entryPanel).toContainText('cpc');
    await expect(entryPanel).toContainText('responselock_demo');
    await expect(entryPanel).toContainText('DEMO-GCLID-001');

    // 2. Complete Step 1 and proceed to Step 2
    const proceedBtn = page.locator('[data-testid="proceed-to-step-2"]');
    await proceedBtn.click();

    // Verify Step 2 controls are visible
    const submitBtn = page.locator('[data-testid="defect5-submit-button"]');
    await expect(submitBtn).toBeVisible();

    // Verify URL query parameters were stripped by SPA client navigation
    const searchAfterNav = await page.evaluate(() => window.location.search);
    expect(searchAfterNav).not.toContain('utm_source');
    expect(searchAfterNav).not.toContain('DEMO-GCLID-001');

    const afterNavPanel = page.locator('[data-testid="inspection-after-navigation"]');
    await expect(afterNavPanel).toContainText('Query String Stripped');

    // 3. Submit Step 2 form and intercept the network request
    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/leads') && res.request().method() === 'POST'),
      submitBtn.click(),
    ]);

    expect(response.status()).toBe(201);
    const responseJson = await response.json();
    expect(responseJson.success).toBe(true);
    expect(responseJson.scenario).toBe('defect-5');

    // 4. Assert dataLayer conversion event: attribution_status is 'dropped'
    const dataLayerEvents = await page.evaluate(() => {
      const dl = (window as unknown as { dataLayer?: Record<string, unknown>[] }).dataLayer;
      return Array.isArray(dl) ? dl : [];
    });

    const conversionEvent = dataLayerEvents.find((evt) => evt.event === 'demo_lead_success');
    expect(conversionEvent).toBeDefined();
    expect(conversionEvent?.scenario).toBe('defect-5');
    expect(conversionEvent?.attribution_status).toBe('dropped');
    expect(conversionEvent?.form_id).toBe('lead_audit_demo');
    expect(conversionEvent?.lead_type).toBe('agency_audit_inquiry');
    expect(conversionEvent?.debug_mode).toBe(true);

    // Assert zero PII in dataLayer
    expect(conversionEvent?.full_name).toBeUndefined();
    expect(conversionEvent?.work_email).toBeUndefined();
    expect(conversionEvent?.phone).toBeUndefined();

    // 5. Assert Stored CRM record has blank / default attribution
    const crmRes = await request.get('/api/crm');
    expect(crmRes.status()).toBe(200);
    const crmData = await crmRes.json();
    expect(crmData.records).toHaveLength(1);

    const crmRecord = crmData.records[0];
    expect(crmRecord.scenario).toBe('defect-5');
    expect(crmRecord.lead_source).toBe('direct');
    expect(crmRecord.lead_source_detail).toBe('none');
    expect(crmRecord.campaign_name).toBe('none');
    expect(crmRecord.gclid).toBe('');

    // 6. Assert all 4 sections of inspection panel are visible in the DOM
    await expect(page.locator('[data-testid="inspection-at-entry"]')).toBeVisible();
    await expect(page.locator('[data-testid="inspection-after-navigation"]')).toBeVisible();
    await expect(page.locator('[data-testid="inspection-submitted-payload"]')).toBeVisible();
    await expect(page.locator('[data-testid="inspection-stored-crm"]')).toBeVisible();
  });

  test('validates Step 1 and dispatches zero API requests on invalid input', async ({ page }) => {
    await page.goto('/scenario/defect-5');

    let leadsRequestCount = 0;
    page.on('request', (req) => {
      if (req.url().includes('/api/leads')) {
        leadsRequestCount++;
      }
    });

    // Clear name field
    const nameInput = page.locator('#defect5-fullname');
    await nameInput.fill('');

    // Attempt to proceed to Step 2
    await page.locator('[data-testid="proceed-to-step-2"]').click();

    // Field error is displayed
    await expect(page.locator('#defect5-fullname-error')).toBeVisible();

    // Step 2 is not reached and 0 requests were sent
    await expect(page.locator('[data-testid="defect5-submit-button"]')).toHaveCount(0);
    expect(leadsRequestCount).toBe(0);
  });

  test('passes automated accessibility check with zero serious or critical violations', async ({
    page,
  }) => {
    await page.goto(
      '/scenario/defect-5?utm_source=google&utm_medium=cpc&utm_campaign=responselock_demo&gclid=DEMO-GCLID-001'
    );

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const seriousOrCritical = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    );
    expect(seriousOrCritical).toEqual([]);
  });
});
