import { test, expect } from '@playwright/test';

test.describe('Wave 0 E2E Smoke Suite: Layout, Routes, Consent, and APIs', () => {
  test.beforeEach(async ({ request }) => {
    // Reset CRM store via dev endpoint before each test
    const resetRes = await request.post('/api/dev/reset');
    expect(resetRes.status()).toBe(200);
  });

  test('root layout renders and prevents duplicate GTM script injection', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/ResponseLock/i);

    // Assert GTM script tag count is at most 1 in the DOM
    const gtmScripts = page.locator('script[src*="googletagmanager.com/gtm.js"]');
    const count = await gtmScripts.count();
    expect(count).toBeLessThanOrEqual(1);
  });

  test('pre-GTM Consent Mode v2 default denial is initialized in dataLayer', async ({ page }) => {
    await page.goto('/');

    const consentDefaultArgs = await page.evaluate(() => {
      const dl = (window as unknown as { dataLayer: unknown[] }).dataLayer;
      if (!Array.isArray(dl)) return null;

      // Search for gtag('consent', 'default', { ... })
      for (const item of dl) {
        if (
          item &&
          typeof item === 'object' &&
          '0' in item &&
          (item as Record<string, unknown>)[0] === 'consent' &&
          (item as Record<string, unknown>)[1] === 'default'
        ) {
          return (item as Record<string, unknown>)[2];
        }
      }
      return null;
    });

    expect(consentDefaultArgs).not.toBeNull();
    expect(consentDefaultArgs).toEqual(
      expect.objectContaining({
        ad_storage: 'denied',
        analytics_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        wait_for_update: 500,
      })
    );
  });

  test('all 10 canonical application routes respond with HTTP 200', async ({ page }) => {
    const canonicalRoutes = [
      '/',
      '/scenario/baseline',
      '/scenario/defect-1',
      '/scenario/defect-2',
      '/scenario/defect-3',
      '/scenario/defect-4',
      '/scenario/defect-5',
      '/scenario/defect-6',
      '/crm',
      '/evidence',
    ];

    for (const route of canonicalRoutes) {
      const response = await page.goto(route);
      expect(response?.status(), `Route ${route} should return HTTP 200`).toBe(200);
    }
  });

  test('leads API enforces Idempotency-Key header and returns field validation errors', async ({ request }) => {
    // 1. Missing Idempotency-Key
    const missingHeaderRes = await request.post('/api/leads', {
      data: {
        submission_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      },
    });
    expect(missingHeaderRes.status()).toBe(400);
    const missingJson = await missingHeaderRes.json();
    expect(missingJson.errors).toHaveProperty('idempotency_key');

    // 2. Mismatched Idempotency-Key
    const mismatchedRes = await request.post('/api/leads', {
      headers: {
        'Idempotency-Key': '11111111-1111-4111-8111-111111111111',
      },
      data: {
        submission_id: '22222222-2222-4222-8222-222222222222',
        scenario: 'baseline',
        full_name: 'Test User',
        work_email: 'demo.user@example.com',
        company_name: 'Test Corp',
        monthly_ad_spend: '$10k',
        primary_challenge: 'Tracking',
      },
    });
    expect(mismatchedRes.status()).toBe(400);

    // 3. Honeypot check
    const honeypotRes = await request.post('/api/leads', {
      headers: {
        'Idempotency-Key': '33333333-3333-4333-8333-333333333333',
      },
      data: {
        submission_id: '33333333-3333-4333-8333-333333333333',
        scenario: 'baseline',
        full_name: 'Spam Bot',
        work_email: 'demo.user@example.com',
        company_name: 'Spam Inc',
        monthly_ad_spend: '$10k',
        primary_challenge: 'Spam',
        website: 'https://spam.org',
      },
    });
    expect(honeypotRes.status()).toBe(400);

    // Verify zero CRM records written on validation errors
    const crmListRes = await request.get('/api/crm');
    const crmJson = await crmListRes.json();
    expect(crmJson.count).toBe(0);
  });

  test('leads API processes valid submission and enforces idempotency on duplicate', async ({ request }) => {
    const submissionId = '44444444-4444-4444-8444-444444444444';
    const payload = {
      submission_id: submissionId,
      scenario: 'baseline',
      full_name: 'Auditor Pro',
      work_email: 'demo.user@example.com',
      company_name: 'Agency Performance',
      monthly_ad_spend: '$20,000',
      primary_challenge: 'Attribution Loss',
      attribution: {
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'responselock_demo',
        gclid: 'DEMO-GCLID-001',
        attribution_status: 'present',
      },
    };

    // First submission -> 201 Created
    const firstRes = await request.post('/api/leads', {
      headers: { 'Idempotency-Key': submissionId },
      data: payload,
    });
    expect(firstRes.status()).toBe(201);
    const firstJson = await firstRes.json();
    expect(firstJson.success).toBe(true);
    expect(firstJson.submission_id).toBe(submissionId);

    // Duplicate submission with identical ID -> 200 OK
    const dupRes = await request.post('/api/leads', {
      headers: { 'Idempotency-Key': submissionId },
      data: payload,
    });
    expect(dupRes.status()).toBe(200);
    const dupJson = await dupRes.json();
    expect(dupJson.duplicate).toBe(true);

    // Verify exactly 1 CRM record is stored
    const crmRes = await request.get('/api/crm');
    const crmJson = await crmRes.json();
    expect(crmJson.count).toBe(1);
    expect(crmJson.records[0].submission_id).toBe(submissionId);
  });
});
