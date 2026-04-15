import { useState, useCallback } from 'react'
import api from '../lib/api'
import type {
  User,
  Token,
  LoginCredentials,
  FirstLoginChangePasswordRequest,
} from '../types'

// Simple global state via module-level variables + custom event
let _token: string | null = localStorage.getItem('pmp_token')
let _mustChangePassword: boolean = localStorage.getItem('pmp_force_password_change') === 'true'

let _user: User | null = (() => {
  try {
    const raw = localStorage.getItem('pmp_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
})()

const listeners = new Set<() => void>()

function notifyListeners() {
  listeners.forEach((fn) => fn())
}

export function useAuthStore() {
  const [, forceRender] = useState(0)

  const subscribe = useCallback(() => {
    const fn = () => forceRender((n) => n + 1)
    listeners.add(fn)
    return () => listeners.delete(fn)
  }, [])

  useState(() => {
    const fn = () => forceRender((n) => n + 1)
    listeners.add(fn)
    return () => listeners.delete(fn)
  })

  const loadCurrentUser = useCallback(async () => {
    const { data: userData } = await api.get<User>('/auth/me')
    localStorage.setItem('pmp_user', JSON.stringify(userData))
    localStorage.setItem('pmp_force_password_change', String(userData.force_password_change))
    _user = userData
    _mustChangePassword = !!userData.force_password_change
    notifyListeners()
    return userData
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    const params = new URLSearchParams()
    params.append('username', credentials.username)
    params.append('password', credentials.password)

    const { data: tokenData } = await api.post<Token>('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    localStorage.setItem('pmp_token', tokenData.access_token)
    localStorage.setItem('pmp_refresh_token', tokenData.refresh_token)
    localStorage.setItem('pmp_force_password_change', String(tokenData.force_password_change))

    _token = tokenData.access_token
    _mustChangePassword = !!tokenData.force_password_change

    if (tokenData.force_password_change) {
      localStorage.removeItem('pmp_user')
      _user = null
      notifyListeners()
      return { force_password_change: true, user: null }
    }

    const userData = await loadCurrentUser()
    notifyListeners()
    return { force_password_change: false, user: userData }
  }, [loadCurrentUser])

  const changeFirstLoginPassword = useCallback(
    async (payload: FirstLoginChangePasswordRequest) => {
      await api.post('/auth/change-password', payload)

      localStorage.setItem('pmp_force_password_change', 'false')
      _mustChangePassword = false

      const userData = await loadCurrentUser()
      notifyListeners()
      return userData
    },
    [loadCurrentUser],
  )

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('pmp_refresh_token')

    try {
      if (refreshToken) {
        await api.post('/auth/logout', {
          refresh_token: refreshToken,
        })
      }
    } catch {
      // ignora erro de logout remoto
    }

    localStorage.removeItem('pmp_token')
    localStorage.removeItem('pmp_refresh_token')
    localStorage.removeItem('pmp_user')
    localStorage.removeItem('pmp_force_password_change')

    _token = null
    _user = null
    _mustChangePassword = false

    notifyListeners()
    window.location.href = '/login'
  }, [])

  return {
    token: _token,
    user: _user,
    mustChangePassword: _mustChangePassword,
    login,
    logout,
    subscribe,
    loadCurrentUser,
    changeFirstLoginPassword,
  }
}