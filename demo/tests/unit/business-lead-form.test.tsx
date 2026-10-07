import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BusinessLeadForm } from '@/components/BusinessLeadForm';
import { countV2CanonicalEvents } from '@/lib/v2-events';

const CONFIRMED_ID = 'c7a829e0-81f3-4d43-9821-2a62886f4a10';

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as Response;
}

function installFetch(post: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input) === '/api/crm') return jsonResponse({ records: [] });
    return post(input, init);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function loadSyntheticValues() {
  await waitFor(() => expect((screen.getByRole('button', { name: 'Request consultation' }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(screen.getByRole('button', { name: 'Use synthetic demo details' }));
}

describe('Alder V2 lead form confirmation gate', () => {
  beforeEach(() => {
    window.dataLayer = [];
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not send a request or emit a canonical event for invalid input', async () => {
    const fetchMock = installFetch(async () => jsonResponse({}));
    render(<BusinessLeadForm showEvidence showDemoActions />);
    await waitFor(() => expect((screen.getByRole('button', { name: 'Request consultation' }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.submit(screen.getByTestId('business-lead-form'));

    expect(await screen.findByText(/Nothing has been sent yet/)).toBeTruthy();
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(0);
    expect(countV2CanonicalEvents(window.dataLayer)).toBe(0);
  });

  it.each([
    ['malformed receipt', { success: true, submission_id: CONFIRMED_ID, status: 'saved', created_at: '2026-10-08T00:00:00Z', scenario: 'baseline' }],
    ['mismatched submission ID', { success: true, submission_id: '11111111-1111-4111-8111-111111111111', status: 'confirmed', created_at: '2026-10-08T00:00:00Z', scenario: 'baseline' }],
  ])('does not emit when the API returns a %s', async (_caseName, receipt) => {
    installFetch(async () => jsonResponse(receipt));
    render(<BusinessLeadForm showEvidence showDemoActions />);
    await loadSyntheticValues();
    fireEvent.submit(screen.getByTestId('business-lead-form'));

    expect(await screen.findByText(/We could not save this request/)).toBeTruthy();
    expect(countV2CanonicalEvents(window.dataLayer)).toBe(0);
    expect(screen.queryByTestId('business-confirmation')).toBeNull();
  });

  it('emits once after a lost-response retry and suppresses a later duplicate replay', async () => {
    let postCount = 0;
    const fetchMock = installFetch(async (_input, init) => {
      postCount += 1;
      if (postCount === 1) throw new TypeError('simulated lost response');
      const submissionId = new Headers(init?.headers).get('Idempotency-Key');
      return jsonResponse({
        success: true,
        submission_id: submissionId,
        status: 'confirmed',
        created_at: '2026-10-08T00:00:00.000Z',
        scenario: 'baseline',
        duplicate: true,
      });
    });
    render(<BusinessLeadForm showEvidence showDemoActions />);
    await loadSyntheticValues();
    fireEvent.submit(screen.getByTestId('business-lead-form'));

    const retryButton = await screen.findByRole('button', { name: /Retry the same saved request/ });
    fireEvent.click(retryButton);
    await screen.findByTestId('business-confirmation');
    expect(countV2CanonicalEvents(window.dataLayer)).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: /Replay same request/ }));
    await waitFor(() => expect(postCount).toBe(3));
    expect(countV2CanonicalEvents(window.dataLayer)).toBe(1);

    const postCalls = fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST');
    expect(postCalls).toHaveLength(3);
    const keys = postCalls.map(([, init]) => new Headers(init?.headers).get('Idempotency-Key'));
    expect(new Set(keys).size).toBe(1);
    expect(JSON.parse(String(postCalls[0]?.[1]?.body)).submission_id).toBe(keys[0]);
  });
});
