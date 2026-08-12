// Thin fetch wrapper. All requests send cookies (JWT lives in an HTTP-only
// cookie set by the Express backend). Throws ApiError so callers can branch on
// status (e.g. 401 -> session expired -> redirect to /login).

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type Json = Record<string, unknown>

async function request<T>(
  path: string,
  options: Omit<RequestInit, 'body'> & { body?: Json } = {},
): Promise<T> {
  const { body, headers, ...rest } = options
  const res = await fetch(path, {
    credentials: 'include',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...rest,
  })

  let data: any = null
  try {
    data = await res.json()
  } catch {
    /* non-JSON response */
  }

  if (!res.ok || (data && data.success === false)) {
    const message =
      (data && (data.message || data.error)) || `Request failed (${res.status})`
    throw new ApiError(res.status, message)
  }
  return data as T
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: Json) =>
    request<T>(path, { method: 'POST', body }),
}
