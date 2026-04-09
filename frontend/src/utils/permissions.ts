export const isAdmin = (role?: string) => role === 'ADMIN'

export const canEditPmp = (role?: string) =>
  role === 'ADMIN' || role === 'PCP'