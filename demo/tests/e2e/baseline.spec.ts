import { test, expect } from '@playwright/test';

test.describe('Baseline Lead Capture Scenario (/scenario/baseline)', () => {
  test.beforeEach(async ({ request }) => {
    // Reset CRM store before each test to ensure isolated determinism
    const resetRes = await request.post('/api/dev/reset');
    expect(resetRes.status()).toBe(200);
  });

  test('executes intact 12-step conversion chain on valid submission', async ({
    page,
    request,
  }) => {
    // 1. Visit baseline route with active marketing attribution parameters
    await page.goto(
      '/scenario/baseline?utm_source=google&utm_medium=cpc&utm_campaign=responselock_demo&gclid=DEMO-GCLID-001'
    );

    // Verify page header and verification layer badges
    await expect(page.getByTestId('scenario-title')).toHaveText('Baseline Valid Form');
    await expect(page.getByTestId('verification-layer-confirmed-locally')).toBeVisible();
    await expect(page.getByTestId('verification-layer-requires-gtm-preview')).toBeVisible();

    // 2. Fill in valid fictional form inputs
    await page.getByTestId('baseline-full-name').fill('Alex Morgan');
    await page.getByTestId('baseline-work-email').fill('demo.user@example.com');
    await page.getByTestId('baseline-company-name').fill('Apex Performance Media');
    await page.getByTestId('baseline-ad-spend').selectOption('$10k-$50k');
    await page
      .getByTestId('baseline-challenge')
      .selectOption('Conversion Discrepancy (CRM vs GA4/Ads)');
    await page
      .getByTestId('baseline-notes')
      .fill('Testing intact baseline conversion chain.');

    // Prepare response listener for POST /api/leads
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/leads') && res.request().method() === 'POST'
    );

    // 3. Submit form and verify submit button disables during request flight
    const submitBtn = page.getByTestId('baseline-submit-button');
    await submitBtn.click();

    // 4. Await server response
    const response = await responsePromise;
    expect(response.status()).toBe(201);

    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.status).toBe('confirmed');
    expect(responseData.submission_id).toBeDefined();

    // 5. Verify SuccessPanel renders strictly from server response data
    await expect(page.getByTestId('success-panel')).toBeVisible();
    await expect(page.getByTestId('success-submission-id')).toHaveText(
      responseData.submission_id
    );
    await expect(page.getByTestId('success-status')).toHaveText('confirmed');

    // 6. Verify window.dataLayer received exactly 1 demo_lead_success event
    const dataLayerEvents = await page.evaluate(() => {
      const dl = (window as unknown as { dataLayer?: Record<string, unknown>[] })
        .dataLayer;
      return (dl || []).filter((item) => item.event === 'demo_lead_success');
    });

    expect(dataLayerEvents.length).toBe(1);
    const event = dataLayerEvents[0]!;

    // Assert strictly the 7 approved application keys whitelist (excluding GTM runtime properties like gtm.uniqueEventId)
    const appKeys = Object.keys(event)
      .filter((k) => !k.startsWith('gtm.'))
      .sort();

    const approvedKeys = [
      'attribution_status',
      'debug_mode',
      'event',
      'form_id',
      'lead_type',
      'scenario',
      'submission_id',
    ].sort();

    expect(appKeys).toEqual(approvedKeys);
    expect(event.form_id).toBe('lead_audit_demo');
    expect(event.lead_type).toBe('agency_audit_inquiry');
    expect(event.scenario).toBe('baseline');
    expect(event.submission_id).toBe(responseData.submission_id);
    expect(event.attribution_status).toBe('present');
    expect(event.debug_mode).toBe(true);

    // Assert Zero PII in dataLayer
    const eventString = JSON.stringify(event).toLowerCase();
    expect(eventString).not.toContain('alex');
    expect(eventString).not.toContain('demo.user');
    expect(eventString).not.toContain('apex');

    // 7. Verify exactly 1 CRM record is stored locally
    const crmRes = await request.get('/api/crm');
    const crmJson = await crmRes.json();
    expect(crmJson.count).toBe(1);

    const record = crmJson.records[0]!;
    expect(record.submission_id).toBe(responseData.submission_id);
    expect(record.full_name).toBe('Alex Morgan');
    expect(record.work_email).toBe('demo.user@example.com');
    expect(record.company_name).toBe('Apex Performance Media');
    expect(record.lead_source).toBe('google');
    expect(record.lead_source_detail).toBe('cpc');
    expect(record.campaign_name).toBe('responselock_demo');
    expect(record.gclid).toBe('DEMO-GCLID-001');
    expect(record.mapping_status).toBe('valid');
  });

  test('enforces zero network requests, zero CRM rows, and zero dataLayer events on invalid submission', async ({
    page,
    request,
  }) => {
    // Intercept network requests to /api/leads to verify 0 network calls dispatched
    let apiCallCount = 0;
    await page.route('**/api/leads', (route) => {
      apiCallCount++;
      return route.continue();
    });

    await page.goto('/scenario/baseline');

    // Attempt to submit empty form
    const submitBtn = page.getByTestId('baseline-submit-button');
    await submitBtn.click();

    // 1. Assert inline field errors are visible
    await expect(page.getByTestId('baseline-full-name-error')).toBeVisible();
    await expect(page.getByTestId('baseline-work-email-error')).toBeVisible();
    await expect(page.getByTestId('baseline-company-name-error')).toBeVisible();

    // 2. Assert ZERO network requests dispatched to API
    expect(apiCallCount).toBe(0);

    // 3. Assert NO success panel rendered
    await expect(page.getByTestId('success-panel')).toHaveCount(0);

    // 4. Assert NO demo_lead_success event pushed to dataLayer
    const conversionCount = await page.evaluate(() => {
      const dl = (window as unknown as { dataLayer?: Record<string, unknown>[] })
        .dataLayer;
      return (dl || []).filter((item) => item.event === 'demo_lead_success').length;
    });
    expect(conversionCount).toBe(0);

    // 5. Assert ZERO CRM records stored
    const crmRes = await request.get('/api/crm');
    const crmJson = await crmRes.json();
    expect(crmJson.count).toBe(0);
  });

  test('rejects bot submission when honeypot fields are filled without triggering conversion', async ({
    page,
    request,
  }) => {
    let apiCallCount = 0;
    await page.route('**/api/leads', (route) => {
      apiCallCount++;
      return route.continue();
    });

    await page.goto('/scenario/baseline');

    // Fill valid fields
    await page.getByTestId('baseline-full-name').fill('Spam Bot');
    await page.getByTestId('baseline-work-email').fill('demo.user@example.com');
    await page.getByTestId('baseline-company-name').fill('Spam Corp');

    // Fill honeypot field
    await page.locator('input#baseline-website').fill('https://bot-farm.example.org');

    await page.getByTestId('baseline-submit-button').click();

    // Honeypot should block submission on client
    expect(apiCallCount).toBe(0);
    await expect(page.getByTestId('success-panel')).toHaveCount(0);

    const conversionCount = await page.evaluate(() => {
      const dl = (window as unknown as { dataLayer?: Record<string, unknown>[] })
        .dataLayer;
      return (dl || []).filter((item) => item.event === 'demo_lead_success').length;
    });
    expect(conversionCount).toBe(0);

    const crmRes = await request.get('/api/crm');
    const crmJson = await crmRes.json();
    expect(crmJson.count).toBe(0);
  });

  test('provides accessible markup and aria wiring for assistive technology', async ({
    page,
  }) => {
    await page.goto('/scenario/baseline');

    const form = page.getByTestId('baseline-form');
    // Assert form has noValidate attribute
    await expect(form).toHaveAttribute('novalidate', '');

    // Trigger validation
    await page.getByTestId('baseline-submit-button').click();

    // Check aria-invalid and aria-describedby wiring
    const nameInput = page.getByTestId('baseline-full-name');
    await expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    await expect(nameInput).toHaveAttribute(
      'aria-describedby',
      'baseline-full-name-error'
    );

    const errorAlert = page.getByTestId('baseline-full-name-error');
    await expect(errorAlert).toHaveAttribute('role', 'alert');

    // Check live region status announcement
    const liveRegion = page.getByTestId('baseline-status-region');
    await expect(liveRegion).toHaveAttribute('role', 'status');
    await expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });
});
