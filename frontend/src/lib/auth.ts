import api from './api'

export async function forgotPassword(email: string) {
  return api.post('/auth/forgot-password', { email })
}

export async function resetPassword(token: string, newPassword: string) {
  return api.post(`/auth/reset-password/${token}`, {
    new_password: newPassword,
  })
}