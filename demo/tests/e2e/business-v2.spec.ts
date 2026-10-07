import { expect, test } from '@playwright/test';

test.describe('Alder V2 verified local lead flow', () => {
  test.beforeEach(async ({ request }) => {
    const reset = await request.post('/api/dev/reset');
    expect(reset.ok()).toBe(true);
  });

  test('records an attributed lead locally and emits the canonical payload only after confirmation', async ({ page, request }) => {
    const analyticsRequests: string[] = [];
    page.on('request', (req) => {
      if (/google-analytics\.com\/(?:g\/collect|mp\/collect)/i.test(req.url())) analyticsRequests.push(req.url());
    });
    await page.goto('/?utm_source=qa_partner&utm_medium=referral&utm_campaign=autumn_2026&utm_term=workplace&utm_content=footer&gclid=QaClickId123');

    await page.getByLabel('Name').fill('Jordan Lee');
    await page.getByLabel('Work email').fill('jordan.lee@example.com');
    await page.getByLabel('Company').fill('Alder Office Services');
    const responsePromise = page.waitForResponse((response) => response.url().includes('/api/leads') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Request consultation' }).click();
    const response = await responsePromise;
    expect(response.status()).toBe(201);
    const confirmed = await response.json();
    await expect(page.getByTestId('business-confirmation')).toBeVisible();

    const events = await page.evaluate(() => ((window as Window & { dataLayer?: unknown[] }).dataLayer ?? []).filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null && (item as Record<string, unknown>).event === 'demo_lead_success' && (item as Record<string, unknown>).form_id === 'alder_consultation'));
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      event: 'demo_lead_success', form_id: 'alder_consultation', lead_type: 'consultation',
      scenario: 'baseline', submission_id: confirmed.submission_id, attribution_status: 'present',
      debug_mode: true, utm_source: 'qa_partner', utm_medium: 'referral',
      utm_campaign: 'autumn_2026', utm_term: 'workplace', utm_content: 'footer', gclid: 'QaClickId123',
    });
    expect(events[0]?.timestamp).toEqual(expect.any(String));
    expect(JSON.stringify(events[0])).not.toMatch(/jordan\.lee|alder office|work email/i);

    const crm = await request.get('/api/crm').then((res) => res.json());
    expect(crm.count).toBe(1);
    expect(crm.records[0]).toMatchObject({ submission_id: confirmed.submission_id, campaign_name: 'autumn_2026', gclid: 'QaClickId123' });
    expect(analyticsRequests).toHaveLength(0);
  });

  test('blocks empty submission before the lead API and canonical event', async ({ page }) => {
    let leadRequests = 0;
    await page.route('**/api/leads', async (route) => {
      leadRequests += 1;
      await route.continue();
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Request consultation' }).click();

    await expect(page.getByText(/Nothing has been sent yet/)).toBeVisible();
    expect(leadRequests).toBe(0);
    const canonicalEvents = await page.evaluate(() => ((window as Window & { dataLayer?: unknown[] }).dataLayer ?? []).filter((item) => typeof item === 'object' && item !== null && (item as Record<string, unknown>).event === 'demo_lead_success' && (item as Record<string, unknown>).form_id === 'alder_consultation').length);
    expect(canonicalEvents).toBe(0);

    await page.goto('/audit');
    let auditLeadRequests = 0;
    await page.route('**/api/leads', async (route) => {
      auditLeadRequests += 1;
      await route.continue();
    });
    await page.getByRole('button', { name: 'Test invalid submission' }).click();
    const brokenFormEvents = await page.evaluate(() => ((window as Window & { dataLayer?: unknown[] }).dataLayer ?? []).filter((item) => typeof item === 'object' && item !== null && (item as Record<string, unknown>).event === 'demo_lead_success' && (item as Record<string, unknown>).form_id === 'alder_consultation_broken').length);
    expect(brokenFormEvents).toBe(1);
    await expect(page.getByTestId('audit-canonical-count')).toHaveText('0');
    await page.getByRole('button', { name: 'Apply corrected handler' }).click();
    await page.getByRole('button', { name: 'Test invalid submission' }).click();
    expect(auditLeadRequests).toBe(0);
    await expect(page.getByTestId('audit-canonical-count')).toHaveText('0');
  });

  test('emits once after a lost response retry, suppresses replay, and allows a new lead only after explicit reset', async ({ page, request }) => {
    let leadRequests = 0;
    await page.route('**/api/leads', async (route) => {
      leadRequests += 1;
      if (leadRequests === 1) {
        await route.fetch(); // Let the server commit, then simulate a response lost on the way back.
        await route.abort('failed');
        return;
      }
      await route.continue();
    });
    await page.goto('/audit');
    const runSynthetic = page.getByRole('button', { name: 'Run synthetic valid lead through the real pipeline' });
    await expect(runSynthetic).toBeEnabled();
    await runSynthetic.click();
    await page.getByRole('button', { name: /Retry the same saved request/ }).waitFor();
    await page.getByRole('button', { name: /Retry the same saved request/ }).click();
    await expect(page.getByTestId('business-confirmation')).toBeVisible();
    await expect(page.getByTestId('audit-canonical-count')).toHaveText('1');

    const confirmedButton = page.getByRole('button', { name: 'Request confirmed' });
    await expect(confirmedButton).toBeDisabled();
    await page.getByRole('button', { name: /Replay same request to demonstrate duplicate protection/ }).click();
    await expect.poll(() => leadRequests).toBe(3);
    await expect(page.getByTestId('business-event-count')).toHaveText('1');

    const crmOne = await request.get('/api/crm').then((res) => res.json());
    expect(crmOne.count).toBe(1);
    const ids = await page.evaluate(() => ((window as Window & { dataLayer?: unknown[] }).dataLayer ?? []).filter((item) => typeof item === 'object' && item !== null && (item as Record<string, unknown>).event === 'demo_lead_success' && (item as Record<string, unknown>).form_id === 'alder_consultation').map((item) => (item as Record<string, unknown>).submission_id));
    expect(ids).toHaveLength(1);

    await page.getByRole('button', { name: 'Start another request' }).click();
    const form = page.getByTestId('business-lead-form');
    await page.getByRole('button', { name: 'Use synthetic demo details' }).click();
    await expect(form.getByRole('button', { name: 'Request consultation' })).toBeEnabled();
    await form.getByRole('button', { name: 'Request consultation' }).click();
    await expect(page.getByTestId('business-event-count')).toHaveText('2');
    const crmTwo = await request.get('/api/crm').then((res) => res.json());
    expect(crmTwo.count).toBe(2);
  });

  test('restores a complete pending request after refresh and retries with the original key', async ({ page, request }) => {
    let savedKey: string | null = null;
    let savedName: unknown;
    let leadRequests = 0;
    await page.route('**/api/leads', async (route) => {
      leadRequests += 1;
      const requestData = route.request().postDataJSON() as Record<string, unknown>;
      const requestKey = route.request().headers()['idempotency-key'] ?? null;
      if (leadRequests === 1) {
        savedKey = requestKey;
        savedName = requestData['full_name'];
        await route.abort('failed');
        return;
      }
      expect(requestKey).toBe(savedKey);
      expect(requestData['full_name']).toBe(savedName);
      await route.continue();
    });
    await page.goto('/audit');
    const form = page.getByTestId('business-lead-form');
    await page.getByRole('button', { name: 'Use synthetic demo details' }).click();
    await expect(form.getByRole('button', { name: 'Request consultation' })).toBeEnabled();
    await form.getByRole('button', { name: 'Request consultation' }).click();
    await page.getByRole('button', { name: /Retry the same saved request/ }).waitFor();
    await page.reload();
    const restoredForm = page.getByTestId('business-lead-form');
    await expect(restoredForm.getByLabel('Name')).toHaveValue('Jordan Lee');
    await expect(restoredForm.getByRole('button', { name: 'Retry saved request' })).toBeEnabled();
    await restoredForm.getByRole('button', { name: 'Retry saved request' }).click();
    await expect(page.getByTestId('business-confirmation')).toBeVisible();
    expect(leadRequests).toBe(2);

    const crm = await request.get('/api/crm').then((res) => res.json());
    expect(crm.count).toBe(1);
    expect(crm.records[0].work_email).toBe('jordan.lee@example.com');
    const eventIds = await page.evaluate(() => ((window as Window & { dataLayer?: unknown[] }).dataLayer ?? []).filter((item) => typeof item === 'object' && item !== null && (item as Record<string, unknown>).event === 'demo_lead_success' && (item as Record<string, unknown>).form_id === 'alder_consultation').map((item) => (item as Record<string, unknown>).submission_id));
    expect(eventIds).toHaveLength(1);
  });

  test('preserves attribution across route navigation and fits a fresh audit view on mobile', async ({ page }) => {
    const runtimeErrors: string[] = [];
    page.on('pageerror', (error) => runtimeErrors.push(error.message));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/?utm_source=qa_navigation&utm_medium=referral&utm_campaign=mobile_check');
    await page.getByRole('link', { name: /Verification details/ }).click();
    await expect(page).toHaveURL(/\/audit$/);
    await expect(page.getByTestId('business-lead-form')).toBeVisible();
    await expect(page.getByText('qa_navigation / referral')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
    expect(runtimeErrors).toEqual([]);
  });
});
