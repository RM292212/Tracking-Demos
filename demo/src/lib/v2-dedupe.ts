const EMITTED_IDS_KEY = 'responselock_v2_emitted_submission_ids';
const RETRY_ID_KEY = 'responselock_v2_retry_submission_id';
const PENDING_REQUEST_KEY = 'responselock_v2_pending_request';
const emittedInMemory = new Set<string>();

function readIds(): string[] {
  try {
    const raw = window.sessionStorage.getItem(EMITTED_IDS_KEY);
    const value: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
  } catch {
    return [];
  }
}

export function wasV2EventEmitted(id: string): boolean {
  if (typeof window === 'undefined') return false;
  return emittedInMemory.has(id) || readIds().includes(id);
}

export function markV2EventEmitted(id: string): void {
  if (typeof window === 'undefined') return;
  emittedInMemory.add(id);
  try {
    const ids = readIds();
    if (!ids.includes(id)) ids.push(id);
    window.sessionStorage.setItem(EMITTED_IDS_KEY, JSON.stringify(ids.slice(-100)));
  } catch {
    // In-memory caller guard still prevents duplicates during this page visit.
  }
}

export function getV2RetrySubmissionId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(RETRY_ID_KEY);
  } catch {
    return null;
  }
}

export function setV2RetrySubmissionId(id: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (id) window.sessionStorage.setItem(RETRY_ID_KEY, id);
    else window.sessionStorage.removeItem(RETRY_ID_KEY);
  } catch {
    // Session persistence is best effort in restricted browser contexts.
  }
}

export function getV2PendingRequest(): unknown | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_REQUEST_KEY);
    return raw ? JSON.parse(raw) as unknown : null;
  } catch {
    return null;
  }
}

export function setV2PendingRequest(request: unknown | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (request) window.sessionStorage.setItem(PENDING_REQUEST_KEY, JSON.stringify(request));
    else window.sessionStorage.removeItem(PENDING_REQUEST_KEY);
  } catch {
    // In-memory pending payload remains available during this page visit.
  }
}
