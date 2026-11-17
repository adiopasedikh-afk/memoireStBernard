export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

let csrfToken: string | null = null;

export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '');
  if (envUrl) {
    return envUrl;
  }
  return 'https://hay-vhs-textbook-liability.trycloudflare.com';
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();

  const method = (init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
  if (init.body && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && csrfToken) {
    headers.set('X-CSRF-Token', csrfToken);
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
    csrfToken = typeof token === 'string' ? token : null;
  }

  return payload as T;
}

export function clearApiSession(): void {
  csrfToken = null;
}
