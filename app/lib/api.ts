export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

let csrfToken: string | null = null;

function getStoredCsrfToken(): string | null {
  if (csrfToken) return csrfToken;
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem('saint_bernard_csrf');
      if (stored) {
        csrfToken = stored;
        return stored;
      }
    } catch {
      // ignore
    }
  }
  return null;
}

function setStoredCsrfToken(token: string | null): void {
  csrfToken = token;
  if (typeof window !== 'undefined') {
    try {
      if (token) {
        sessionStorage.setItem('saint_bernard_csrf', token);
      } else {
        sessionStorage.removeItem('saint_bernard_csrf');
      }
    } catch {
      // ignore
    }
  }
}

export function getApiBaseUrl(): string {
  // Sur Vercel (HTTPS), cibler directement le backend permanent sur le VPS
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return 'https://bdsaintbernard.youandme.cloud';
  }
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '');
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }
  return 'http://127.0.0.1:8098';
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();

  const method = (init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
  if (init.body && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const activeCsrf = getStoredCsrfToken();
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && activeCsrf) {
    headers.set('X-CSRF-Token', activeCsrf);
  }

  const response = await fetch(`${baseUrl.replace(/\/+$/, '')}${path}`, {
    ...init,
    method,
    headers,
    credentials: 'include',
  });

  let payload: unknown = null;
  const responseText = await response.text();
  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      throw new ApiError('The API returned an invalid response.', response.status);
    }
  }

  if (!response.ok) {
    const message = typeof payload === 'object' && payload !== null && 'error' in payload
      ? String(payload.error)
      : `API request failed with status ${response.status}.`;
    throw new ApiError(message, response.status);
  }

  if (typeof payload === 'object' && payload !== null && 'csrfToken' in payload) {
    const token = payload.csrfToken;
    setStoredCsrfToken(typeof token === 'string' ? token : null);
  }

  return payload as T;
}

export function clearApiSession(): void {
  setStoredCsrfToken(null);
}
