type ApiError = { message?: string }

async function readResponse<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => ({}))) as T & ApiError
  if (!response.ok) throw new Error(data.message || 'Não foi possível processar a solicitação.')
  return data
}

export async function getJson<T>(path: string, token?: string): Promise<T> {
  return readResponse<T>(await fetch(path, { headers: token ? { Authorization: `Bearer ${token}` } : {} }))
}

export async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return readResponse<T>(response)
}

export async function authorizedJson<T>(path: string, method: string, token: string, payload?: unknown): Promise<T> {
  return readResponse<T>(await fetch(path, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(payload ? { 'Content-Type': 'application/json' } : {}) },
    body: payload ? JSON.stringify(payload) : undefined,
  }))
}
