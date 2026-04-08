import { useState, useCallback } from 'react'
import api from '../lib/api'
import type { User, Token, LoginCredentials } from '../types'

// Simple global state via module-level variables + custom event
let _token: string | null = localStorage.getItem('pmp_token')
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

  // Subscribe on mount
  useState(() => {
    const fn = () => forceRender((n) => n + 1)
    listeners.add(fn)
    return () => listeners.delete(fn)
  })

  const login = useCallback(async (credentials: LoginCredentials) => {
    const params = new URLSearchParams()
    params.append('username', credentials.username)
    params.append('password', credentials.password)

    const { data: tokenData } = await api.post<Token>('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })


    localStorage.setItem('pmp_token', tokenData.access_token)
    localStorage.setItem('pmp_refresh_token', tokenData.refresh_token)
    _token = tokenData.access_token

    const { data: userData } = await api.get<User>('/auth/me')
    localStorage.setItem('pmp_user', JSON.stringify(userData))
    _user = userData

    notifyListeners()
    return userData
  }, [])

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
  _token = null
  _user = null
  notifyListeners()
  window.location.href = '/login'
}, [])

  return {
    token: _token,
    user: _user,
    login,
    logout,
    subscribe,
  }
}
