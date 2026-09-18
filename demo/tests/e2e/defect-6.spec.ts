import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Defect 6 E2E Suite: Webhook Field Mapping Misconfiguration in CRM', () => {
  test.beforeEach(async ({ request }) => {
    // Dev reset ensures clean CRM store state before each test
    const resetRes = await request.post('/api/dev/reset');
    expect(resetRes.status()).toBe(200);
  });

  test('submits valid lead with complete attribution, but server CRM row is corrupted by defect-06 mapper', async ({
    page,
    request,
  }) => {
    // 1. Visit Defect 6 page
    await page.goto('/scenario/defect-6');

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

    // 2. Submit form and intercept API response
    const submitBtn = page.locator('[data-testid="defect6-submit-button"]');
    await expect(submitBtn).toBeVisible();

    const [response] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/leads') && res.request().method() === 'POST'
      ),
      submitBtn.click(),
    ]);

    expect(response.status()).toBe(201);
    const responseJson = await response.json();
    expect(responseJson.success).toBe(true);
    expect(responseJson.scenario).toBe('defect-6');

    // 3. Marketing perspective: dataLayer pushed successfully with 'present' attribution
    const dataLayerEvents = await page.evaluate(() => {
      const dl = (window as unknown as { dataLayer?: Record<string, unknown>[] }).dataLayer;
      return Array.isArray(dl) ? dl : [];
    });

    const conversionEvent = dataLayerEvents.find((evt) => evt.event === 'demo_lead_success');
    expect(conversionEvent).toBeDefined();
    expect(conversionEvent?.scenario).toBe('defect-6');
    expect(conversionEvent?.attribution_status).toBe('present');
    expect(conversionEvent?.form_id).toBe('lead_audit_demo');
    expect(conversionEvent?.debug_mode).toBe(true);

    // Assert zero PII
    expect(conversionEvent?.full_name).toBeUndefined();
    expect(conversionEvent?.work_email).toBeUndefined();
    expect(conversionEvent?.phone).toBeUndefined();

    // 4. Sales / CRM perspective: query /api/crm and verify corruption by mappers/defect-06.ts
    const crmRes = await request.get('/api/crm');
    expect(crmRes.status()).toBe(200);
    const crmData = await crmRes.json();
    expect(crmData.records).toHaveLength(1);

    const crmRecord = crmData.records[0];
    expect(crmRecord.scenario).toBe('defect-6');
    // Field 1: lead_source dropped
    expect(crmRecord.lead_source).toBe('');
    // Field 2: lead_source_detail contains utm_source ('google')
    expect(crmRecord.lead_source_detail).toBe('google');
    // Field 3: campaign_name dropped
    expect(crmRecord.campaign_name).toBe('');
    // Field 4: gclid preserved
    expect(crmRecord.gclid).toBe('DEMO-GCLID-001');
    // Status markers
    expect(crmRecord.mapping_status).toBe('corrupted');
    expect(crmRecord.missing_fields).toEqual(['lead_source', 'campaign_name']);

    // 5. Educational UI comparison panel is rendered
    const comparisonTable = page.locator('[data-testid="crm-comparison-table"]');
    await expect(comparisonTable).toBeVisible();
    await expect(comparisonTable).toContainText('DROPPED');
    await expect(comparisonTable).toContainText('MISMAPPED');
    await expect(comparisonTable).toContainText('CORRUPTED');
    await expect(comparisonTable).toContainText('INTACT');
  });

  test('prevents submission on invalid input with zero API calls', async ({ page }) => {
    await page.goto('/scenario/defect-6');

    let leadsRequestCount = 0;
    page.on('request', (req) => {
      if (req.url().includes('/api/leads')) {
        leadsRequestCount++;
      }
    });

    // Clear required name input
    const nameInput = page.locator('#defect6-fullname');
    await nameInput.fill('');

    // Click submit
    await page.locator('[data-testid="defect6-submit-button"]').click();

    // Verify error and zero network traffic
    await expect(page.locator('#defect6-fullname-error')).toBeVisible();
    expect(leadsRequestCount).toBe(0);
  });

  test('passes automated accessibility check with zero serious or critical violations', async ({
    page,
  }) => {
    await page.goto('/scenario/defect-6');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const seriousOrCritical = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    );
    expect(seriousOrCritical).toEqual([]);
  });
});
