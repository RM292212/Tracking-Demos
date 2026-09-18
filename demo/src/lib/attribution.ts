/**
 * ResponseLock Marketing Attribution Persistence Engine
 * Location: demo/src/lib/attribution.ts
 *
 * Implements first-touch persistence via 90-day cookie and last-touch
 * persistence via sessionStorage. Captures UTM query parameters and
 * ad click identifiers (gclid, gbraid, wbraid) without external network egress.
 */

import {
  AttributionParams,
  AttributionState,
  AttributionStatus,
  ATTRIBUTION_STORAGE_KEYS,
  deriveAttributionStatus,
  hasAnyAttribution,
} from '@/lib/contracts/attribution';

export {
  deriveAttributionStatus,
  hasAnyAttribution,
  ATTRIBUTION_STORAGE_KEYS,
};
export type { AttributionParams, AttributionState, AttributionStatus };

const COOKIE_MAX_AGE_DAYS = 90;
const COOKIE_MAX_AGE_SECONDS = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;

/**
 * Safely parse document.cookie to extract a value by key.
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie ? document.cookie.split('; ') : [];
  const prefix = `${encodeURIComponent(name)}=`;
  for (const cookie of cookies) {
    if (cookie.startsWith(prefix)) {
      const rawValue = cookie.substring(prefix.length);
      try {
        return decodeURIComponent(rawValue);
      } catch {
        return rawValue;
      }
    }
  }
  return null;
}

/**
 * Set a cookie with specified lifetime in days.
 */
export function setCookie(name: string, value: string, days = COOKIE_MAX_AGE_DAYS): void {
  if (typeof document === 'undefined') return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value
  )}; max-age=${maxAge}; path=/; SameSite=Lax`;
}

/**
 * Delete a cookie by setting its max-age to 0.
 */
export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${encodeURIComponent(name)}=; max-age=0; path=/; SameSite=Lax`;
}

/**
 * Safely read and parse a JSON string from sessionStorage.
 */
export function getSessionStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Safely write a string to sessionStorage.
 */
export function setSessionStorage(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Ignore quota or security exceptions in restricted contexts
  }
}

/**
 * Safely remove an item from sessionStorage.
 */
export function removeSessionStorage(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore errors
  }
}

/**
 * Extracts marketing parameters from a query string or URLSearchParams.
 */
export function parseAttributionFromQuery(
  input?: string | URLSearchParams | null
): AttributionParams {
  let searchParams: URLSearchParams;

  if (!input) {
    if (typeof window !== 'undefined' && window.location) {
      searchParams = new URLSearchParams(window.location.search);
    } else {
      return {};
    }
  } else if (typeof input === 'string') {
    // Strip leading ? if present
    const cleanQuery = input.startsWith('?') ? input.slice(1) : input;
    searchParams = new URLSearchParams(cleanQuery);
  } else {
    searchParams = input;
  }

  const params: AttributionParams = {};
  const keys: (keyof AttributionParams)[] = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'gclid',
    'gbraid',
    'wbraid',
  ];

  for (const key of keys) {
    const val = searchParams.get(key);
    if (val && val.trim() !== '') {
      params[key] = val.trim();
    }
  }

  return params;
}

/**
 * Read the first-touch attribution state from the ~90 day cookie.
 */
export function getFirstTouchAttribution(): AttributionState | null {
  const cookieVal = getCookie(ATTRIBUTION_STORAGE_KEYS.FIRST_TOUCH_COOKIE);
  if (!cookieVal) return null;
  try {
    return JSON.parse(cookieVal) as AttributionState;
  } catch {
    return null;
  }
}

/**
 * Store first-touch attribution state in the 90-day cookie.
 */
export function setFirstTouchAttribution(state: AttributionState): void {
  setCookie(
    ATTRIBUTION_STORAGE_KEYS.FIRST_TOUCH_COOKIE,
    JSON.stringify(state),
    COOKIE_MAX_AGE_DAYS
  );
}

/**
 * Read last-touch attribution state from sessionStorage.
 */
export function getLastTouchAttribution(): AttributionState | null {
  const sessionVal = getSessionStorage(ATTRIBUTION_STORAGE_KEYS.LAST_TOUCH_SESSION);
  if (!sessionVal) return null;
  try {
    return JSON.parse(sessionVal) as AttributionState;
  } catch {
    return null;
  }
}

/**
 * Store last-touch attribution state in sessionStorage.
 */
export function setLastTouchAttribution(state: AttributionState): void {
  setSessionStorage(
    ATTRIBUTION_STORAGE_KEYS.LAST_TOUCH_SESSION,
    JSON.stringify(state)
  );
}

/**
 * Captures attribution parameters from the provided search string or current URL,
 * saving them into first-touch (if not already set) and last-touch storage.
 *
 * Returns the captured or active AttributionState.
 */
export function captureAttribution(
  searchOrUrl?: string | URLSearchParams | null
): AttributionState | null {
  const params = parseAttributionFromQuery(searchOrUrl);
  const hasParams = hasAnyAttribution(params);

  const now = Date.now();
  const landingPage =
    typeof window !== 'undefined' ? window.location.pathname : undefined;
  const referrer =
    typeof document !== 'undefined' && document.referrer
      ? document.referrer
      : undefined;

  if (hasParams) {
    const newState: AttributionState = {
      ...params,
      landing_page: landingPage,
      referrer,
      last_touch_timestamp: now,
    };

    // First touch: write only if not already stored
    const existingFirst = getFirstTouchAttribution();
    if (!existingFirst || !hasAnyAttribution(existingFirst)) {
      setFirstTouchAttribution({
        ...newState,
        first_touch_timestamp: now,
      });
    }

    // Last touch: always update with current touch
    setLastTouchAttribution(newState);

    return newState;
  }

  // If no params in URL, return existing persisted attribution
  const existingLast = getLastTouchAttribution();
  if (existingLast && hasAnyAttribution(existingLast)) {
    return existingLast;
  }

  const existingFirst = getFirstTouchAttribution();
  if (existingFirst && hasAnyAttribution(existingFirst)) {
    return existingFirst;
  }

  return null;
}

/**
 * Reads all persisted attribution layers.
 */
export function getPersistedAttribution(): {
  firstTouch: AttributionState | null;
  lastTouch: AttributionState | null;
  active: AttributionState;
} {
  const firstTouch = getFirstTouchAttribution();
  const lastTouch = getLastTouchAttribution();
  const active: AttributionState = {
    ...(firstTouch || {}),
    ...(lastTouch || {}),
  };

  return {
    firstTouch,
    lastTouch,
    active,
  };
}

/**
 * Derives the active attribution payload and its integrity status for lead submission.
 */
export function getAttributionForSubmission(): {
  attribution: AttributionState;
  attribution_status: AttributionStatus;
} {
  const { firstTouch, lastTouch, active } = getPersistedAttribution();
  const status = deriveAttributionStatus(active, firstTouch);

  return {
    attribution: active,
    attribution_status: status,
  };
}

/**
 * Completely clear all attribution cookies and sessionStorage entries.
 */
export function clearAllAttribution(): void {
  deleteCookie(ATTRIBUTION_STORAGE_KEYS.FIRST_TOUCH_COOKIE);
  removeSessionStorage(ATTRIBUTION_STORAGE_KEYS.LAST_TOUCH_SESSION);
}
