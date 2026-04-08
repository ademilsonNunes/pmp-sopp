import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else if (token) prom.resolve(token)
  })
  failedQueue = []
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pmp_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error)
    }

    const refreshToken = localStorage.getItem('pmp_refresh_token')

    if (!refreshToken) {
      localStorage.removeItem('pmp_token')
      localStorage.removeItem('pmp_refresh_token')
      localStorage.removeItem('pmp_user')
      window.location.href = '/login'
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(api(originalRequest))
          },
          reject,
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post('/api/auth/refresh', {
        refresh_token: refreshToken,
      })

      localStorage.setItem('pmp_token', data.access_token)
      localStorage.setItem('pmp_refresh_token', data.refresh_token)

      processQueue(null, data.access_token)

      originalRequest.headers.Authorization = `Bearer ${data.access_token}`
      return api(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)

      localStorage.removeItem('pmp_token')
      localStorage.removeItem('pmp_refresh_token')
      localStorage.removeItem('pmp_user')
      window.location.href = '/login'

      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default api
