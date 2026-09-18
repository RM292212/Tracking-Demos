import { test, expect } from '@playwright/test';

test.describe('Scenario: Defect 4 (DataLayer Schema Drift)', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/dev/reset');
  });

  test('renders page layout, description, and 4 verification layer badges', async ({ page }) => {
    await page.goto('/scenario/defect-4');

    // Title and scenario badge
    await expect(page.locator('h1')).toContainText('Defect 4: Bad/Missing Event Parameters');
    await expect(page.getByText('Schema Drift', { exact: true })).toBeVisible();

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
    await expect(rootCause).toContainText('mappers/defect-04.ts');
    await expect(rootCause).toContainText('formId');
  });

  test('validates form on client and rejects invalid submissions with zero network calls and zero dataLayer events', async ({ page }) => {
    let apiCallCount = 0;
    await page.route('**/api/leads', (route) => {
      apiCallCount++;
      return route.continue();
    });

    await page.goto('/scenario/defect-4');

    // Submit without filling required fields
    const submitButton = page.getByRole('button', { name: /Request Integrity Audit/i });
    await submitButton.click();

    // Assert field-level error messages
    await expect(page.getByText(/Full name must be at least 2 characters/i)).toBeVisible();
    await expect(page.getByText(/A valid email address is required/i)).toBeVisible();
    await expect(page.getByText(/Company name is required/i)).toBeVisible();

    // Invariant: zero API requests
    expect(apiCallCount).toBe(0);

    // Invariant: zero demo_lead_success events (consent default and gtm.js are expected)
    const dataLayer = await page.evaluate(() => {
      return ((window as unknown as { dataLayer?: unknown[] }).dataLayer || []).filter(
        (entry: unknown) => typeof entry === 'object' && entry !== null && 'event' in entry && String((entry as Record<string, unknown>).event).startsWith('demo_lead')
      );
    });
    expect(dataLayer).toHaveLength(0);
  });

  test('submits valid form, pushes mutated payload with missing form_id and mutated lead_type, and renders diff viewer', async ({ page }) => {
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

    await page.goto('/scenario/defect-4');

    // Fill valid lead form with approved fictional data
    await page.getByLabel(/Full Name/i).fill('Morgan Vance');
    await page.getByLabel(/Work Email/i).fill('morgan.vance@example.com');
    await page.getByLabel(/Agency \/ Company Name/i).fill('Summit Growth Partners');

    const submitButton = page.getByRole('button', { name: /Request Integrity Audit/i });
    await submitButton.click();

    // Wait for success container and PayloadDiffViewer
    const successContainer = page.getByTestId('defect-4-success-container');
    await expect(successContainer).toBeVisible();
    await expect(page.getByText(/Lead Submitted Successfully/i)).toBeVisible();

    const diffViewer = page.getByTestId('payload-diff-viewer');
    await expect(diffViewer).toBeVisible();

    // Verify PayloadDiffViewer highlighted anomalies
    const formIdDiff = page.getByTestId('diff-form-id');
    await expect(formIdDiff).toContainText('MISSING (DROPPED)');

    const leadTypeDiff = page.getByTestId('diff-lead-type');
    await expect(leadTypeDiff).toContainText('MUTATED (VALUE MISMATCH)');
    await expect(leadTypeDiff).toContainText('contact');

    // Check displayed submission ID
    const submissionIdDisplay = await page.getByTestId('submission-id-display').textContent();
    expect(submissionIdDisplay).toBeTruthy();

    // Assert API request headers and body
    expect(idempotencyKeyHeader).toBe(submissionIdDisplay);
    const body: Record<string, unknown> = (capturedRequestBody as Record<string, unknown> | null) || {};
    expect(capturedRequestBody).not.toBeNull();
    expect(body['scenario']).toBe('defect-4');
    expect(body['submission_id']).toBe(submissionIdDisplay);

    // Inspect window.dataLayer
    const dataLayer = await page.evaluate(() => {
      return (window as unknown as { dataLayer?: unknown[] }).dataLayer || [];
    });
    expect(dataLayer.length).toBeGreaterThanOrEqual(1);

    const conversionEvents = dataLayer.filter(
      (entry) =>
        typeof entry === 'object' &&
        entry !== null &&
        'event' in entry &&
        (entry as { event: string }).event === 'demo_lead_success'
    );

    expect(conversionEvents).toHaveLength(1);
    const pushed = conversionEvents[0] as Record<string, unknown>;

    // DEFECT 4 VERIFICATION:
    // Event fires ('demo_lead_success'), but parameters are broken
    expect(pushed.event).toBe('demo_lead_success');
    expect('form_id' in pushed).toBe(false); // form_id was dropped by schema drift
    expect(pushed.lead_type).toBe('contact'); // lead_type was mutated to 'contact'
    expect(pushed.scenario).toBe('defect-4');
    expect(pushed.submission_id).toBe(submissionIdDisplay);
    expect(pushed.debug_mode).toBe(true);

    // ZERO PII ASSERTION: No personal contact info in dataLayer
    expect(pushed.full_name).toBeUndefined();
    expect(pushed.work_email).toBeUndefined();
    expect(pushed.company_name).toBeUndefined();
    expect(pushed.email).toBeUndefined();
  });
});
