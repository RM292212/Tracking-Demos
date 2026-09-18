/**
 * Playwright E2E Tests for Simulated CRM Viewer and Store Operations
 * Location: demo/tests/e2e/crm.spec.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Simulated CRM Viewer E2E Suite', () => {
  test.beforeEach(async ({ request }) => {
    // Ensure clean state before each test
    const resetRes = await request.post('/api/dev/reset');
    expect(resetRes.status()).toBe(200);
  });

  test('crm page displays permanent simulated CRM warning banner and empty state', async ({ page }) => {
    await page.goto('/crm');
    await expect(page).toHaveTitle(/ResponseLock/i);

    // 1. Permanent Warning Banner Mandated by Spec
    const warningBanner = page.getByTestId('crm-warning-banner');
    await expect(warningBanner).toBeVisible();
    await expect(warningBanner).toContainText(
      'This is a local simulated CRM used only for ResponseLock training. It is not a production CRM and contains only fictional test records.'
    );

    // 2. Empty state in 10-column table
    const emptyState = page.getByTestId('crm-empty-state');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('No CRM records stored yet');

    // 3. Verify all 10 column headers
    const expectedHeaders = [
      '1. Submission ID',
      '2. Scenario',
      '3. Contact Values',
      '4. Created At',
      '5. lead_source',
      '6. lead_source_detail',
      '7. campaign_name',
      '8. gclid',
      '9. Mapping Status',
      '10. Intentionally Missing Fields',
    ];

    for (const header of expectedHeaders) {
      await expect(page.getByRole('columnheader', { name: header })).toBeVisible();
    }
  });

  test('crm page displays ingested lead records with full field mapping', async ({ page, request }) => {
    const submissionId = '88888888-8888-4888-8888-888888888888';
    const payload = {
      submission_id: submissionId,
      scenario: 'baseline',
      full_name: 'Jordan Lead',
      work_email: 'jordan.lead@example.com',
      company_name: 'Apex Growth Partners',
      monthly_ad_spend: '$30,000',
      primary_challenge: 'Conversion Tracking',
      attribution: {
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'responselock_demo',
        gclid: 'DEMO-GCLID-777',
      },
    };

    // Ingest lead
    const leadRes = await request.post('/api/leads', {
      headers: { 'Idempotency-Key': submissionId },
      data: payload,
    });
    expect(leadRes.status()).toBe(201);

    // Navigate to /crm
    await page.goto('/crm');

    // Stats check
    await expect(page.getByTestId('crm-stat-total')).toHaveText('1');
    await expect(page.getByTestId('crm-stat-valid')).toHaveText('1');

    // Row presence
    const row = page.getByTestId(`crm-row-${submissionId}`);
    await expect(row).toBeVisible();
    await expect(row).toContainText('Jordan Lead');
    await expect(row).toContainText('jordan.lead@example.com');
    await expect(row).toContainText('Apex Growth Partners');
    await expect(row).toContainText('google');
    await expect(row).toContainText('cpc');
    await expect(row).toContainText('responselock_demo');
    await expect(row).toContainText('Valid');
    await expect(row).toContainText('None (intact)');
  });

  test('reset CRM store button truncates store and updates UI', async ({ page, request }) => {
    // Ingest a lead
    const sub1 = '12345678-1234-4234-8234-123456789abc';

    const res1 = await request.post('/api/leads', {
      headers: { 'Idempotency-Key': sub1 },
      data: {
        submission_id: sub1,
        scenario: 'baseline',
        full_name: 'Lead One',
        work_email: 'lead.one@example.com',
        company_name: 'Alpha LLC',
        monthly_ad_spend: '$10,000',
        primary_challenge: 'Testing',
        attribution: {
          utm_source: 'google',
          utm_medium: 'cpc',
          utm_campaign: 'responselock_demo',
          gclid: 'DEMO-GCLID-001',
        },
      },
    });
    expect(res1.status()).toBe(201);

    await page.goto('/crm');
    await expect(page.getByTestId('crm-stat-total')).toHaveText('1');

    // Click Reset CRM Store
    const resetBtn = page.getByTestId('crm-reset-button');
    await resetBtn.click();

    // Verification feedback and cleared table
    await expect(page.getByTestId('crm-feedback-message')).toBeVisible();
    await expect(page.getByTestId('crm-feedback-message')).toContainText(/cleared/i);
    await expect(page.getByTestId('crm-stat-total')).toHaveText('0');
    await expect(page.getByTestId('crm-empty-state')).toBeVisible();

    // Confirm direct API response has count: 0
    const listRes = await request.get('/api/crm');
    const json = await listRes.json();
    expect(json.count).toBe(0);
  });
});
