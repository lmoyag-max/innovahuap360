import axios, { AxiosError } from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // envía la cookie httpOnly del refresh token
})

let accessToken: string | null = null

/** El AuthProvider actualiza el token en memoria tras login/refresh/logout. */
export function setAccessToken(token: string | null) {
  accessToken = token
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ accessToken: string }>(`${API_BASE_URL}/auth/refresh`, null, { withCredentials: true })
      .then((res) => {
        setAccessToken(res.data.accessToken)
        return res.data.accessToken
      })
      .catch(() => {
        setAccessToken(null)
        return null
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config & { _retried?: boolean }) | undefined
    const isAuthRoute = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh')

    if (error.response?.status === 401 && original && !original._retried && !isAuthRoute) {
      original._retried = true
      const newToken = await refreshAccessToken()
      if (newToken) {
        original.headers = original.headers ?? {}
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      }
    }
    return Promise.reject(error)
  },
)

export { refreshAccessToken }

/** Mensaje de error legible a partir de una respuesta de la API. */
export function apiErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined
    if (Array.isArray(data?.message)) return data.message.join(', ')
    if (typeof data?.message === 'string') return data.message
  }
  return fallback
}

/** Descarga un archivo protegido por JWT (un <a href> normal no envía el Bearer token). */
export async function downloadUpload(uploadId: string, filename: string) {
  const response = await api.get(`/uploads/${uploadId}/download`, { responseType: 'blob' })
  const url = URL.createObjectURL(response.data as Blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
