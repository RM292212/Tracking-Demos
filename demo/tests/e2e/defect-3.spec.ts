import { test, expect } from '@playwright/test';

test.describe('Scenario: Defect 3 (Missing Conversion Event)', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/dev/reset');
  });

  test('renders page layout, description, and 4 verification layer badges', async ({ page }) => {
    await page.goto('/scenario/defect-3');

    // Title and scenario badge
    await expect(page.locator('h1')).toContainText('Defect 3: Missing Conversion Event');
    await expect(page.getByText('Missing Conversion')).toBeVisible();

    // 4 Verification Layer Labels
    const labelsContainer = page.getByTestId('verification-layer-labels');
    await expect(labelsContainer).toBeVisible();
    await expect(labelsContainer.getByText('Confirmed locally')).toBeVisible();
    await expect(labelsContainer.getByText('Requires GTM Preview')).toBeVisible();
    await expect(labelsContainer.getByText('Requires GA4 DebugView')).toBeVisible();
    await expect(labelsContainer.getByText('Not tested in Google Ads')).toBeVisible();

    // Root Cause Explanation
    const rootCause = page.getByTestId('root-cause-explanation');
    await expect(rootCause).toBeVisible();
    await expect(rootCause).toContainText('LEGACY_MISSPELLED_EVENT');
    await expect(rootCause).toContainText('demo_lead_sucess');
  });

  test('validates form on client and rejects invalid submissions with zero network calls and zero dataLayer events', async ({ page }) => {
    let apiCallCount = 0;
    await page.route('**/api/leads', (route) => {
      apiCallCount++;
      return route.continue();
    });

    await page.goto('/scenario/defect-3');

    // Submit without filling required fields
    const submitButton = page.getByRole('button', { name: /Request Integrity Audit/i });
    await submitButton.click();

    // Assert field-level error messages
    await expect(page.getByText(/Full name must be at least 2 characters/i)).toBeVisible();
    await expect(page.getByText(/A valid email address is required/i)).toBeVisible();
    await expect(page.getByText(/Company name is required/i)).toBeVisible();

    // Invariant: zero API requests
    expect(apiCallCount).toBe(0);

    // Invariant: zero dataLayer pushes
    const dataLayer = await page.evaluate(() => {
      return (window as unknown as { dataLayer?: unknown[] }).dataLayer || [];
    });
    expect(dataLayer).toHaveLength(0);
  });

  test('submits valid form, creates CRM lead, and pushes LEGACY_MISSPELLED_EVENT to dataLayer', async ({ page }) => {
    let capturedRequestBody: Record<string, unknown> | null = null;
    let idempotencyKeyHeader: string | null = null;

    await page.route('**/api/leads', async (route) => {
      idempotencyKeyHeader = route.request().headers()['idempotency-key'] || null;
      try {
        capturedRequestBody = JSON.parse(route.request().postData() || '{}');
      } catch {
        capturedRequestBody = null;
      }
      return route.continue();
    });

    await page.goto('/scenario/defect-3');

    // Fill valid lead form with approved fictional data
    await page.getByLabel(/Full Name/i).fill('Taylor Reed');
    await page.getByLabel(/Work Email/i).fill('taylor.reed@example.com');
    await page.getByLabel(/Agency \/ Company Name/i).fill('Vanguard Digital Media');

    const submitButton = page.getByRole('button', { name: /Request Integrity Audit/i });
    await submitButton.click();

    // Wait for success container
    const successContainer = page.getByTestId('defect-3-success-container');
    await expect(successContainer).toBeVisible();
    await expect(page.getByText(/Lead Submitted Successfully/i)).toBeVisible();

    // Check displayed submission ID
    const submissionIdDisplay = await page.getByTestId('submission-id-display').textContent();
    expect(submissionIdDisplay).toBeTruthy();

    // Assert API request headers and body
    expect(idempotencyKeyHeader).toBe(submissionIdDisplay);
    const body: Record<string, unknown> = (capturedRequestBody as Record<string, unknown> | null) || {};
    expect(capturedRequestBody).not.toBeNull();
    expect(body['scenario']).toBe('defect-3');
    expect(body['submission_id']).toBe(submissionIdDisplay);

    // Inspect window.dataLayer
    const dataLayer = await page.evaluate(() => {
      return (window as unknown as { dataLayer?: unknown[] }).dataLayer || [];
    });
    expect(dataLayer.length).toBeGreaterThanOrEqual(1);

    // Find the analytics conversion event
    const conversionEvents = dataLayer.filter(
      (entry) =>
        typeof entry === 'object' &&
        entry !== null &&
        (('event' in entry && (entry as { event: string }).event === 'demo_lead_sucess') ||
          (entry as { event: string }).event === 'demo_lead_success')
    );

    expect(conversionEvents).toHaveLength(1);
    const pushed = conversionEvents[0] as Record<string, unknown>;

    // DEFECT 3 VERIFICATION:
    // Pushed event name is misspelled ('demo_lead_sucess')
    expect(pushed.event).toBe('demo_lead_sucess');
    expect(pushed.event).not.toBe('demo_lead_success');
    expect(pushed.scenario).toBe('defect-3');
    expect(pushed.submission_id).toBe(submissionIdDisplay);
    expect(pushed.form_id).toBe('lead_audit_demo');
    expect(pushed.lead_type).toBe('agency_audit_inquiry');
    expect(pushed.debug_mode).toBe(true);

    // ZERO PII ASSERTION: No personal contact info in dataLayer
    expect(pushed.full_name).toBeUndefined();
    expect(pushed.work_email).toBeUndefined();
    expect(pushed.company_name).toBeUndefined();
    expect(pushed.email).toBeUndefined();
  });
});
