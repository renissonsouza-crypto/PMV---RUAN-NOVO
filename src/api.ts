type ApiError = { message?: string }

// Erro tipado que carrega o status HTTP da resposta — sem isso, o
// front-end não tinha como distinguir "sessão expirada" (401/403) de
// "servidor fora do ar" (5xx) ou "dado inválido" (400), e tratava tudo
// como o mesmo erro genérico. Isso é usado, por exemplo, na Área do
// Estudante para decidir entre deslogar o usuário ou oferecer "tentar
// novamente".
export class ApiRequestError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
  }
}

async function readResponse<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => ({}))) as T & ApiError
  if (!response.ok) throw new ApiRequestError(data.message || 'Não foi possível processar a solicitação.', response.status)
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
