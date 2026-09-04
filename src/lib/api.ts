export function clearLegacyAuthToken(): void {
  try {
    localStorage.removeItem('cr_session_token');
  } catch {
    // ignore
  }
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  clearLegacyAuthToken();
  const headers = new Headers(init?.headers || {});

  return fetch(input, {
    ...init,
    headers,
    credentials: 'include',
  });
}
