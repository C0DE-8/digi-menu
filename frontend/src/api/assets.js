import api from './client'

export const backendBaseUrl = (import.meta.env.VITE_BACKEND_URL || api.defaults.baseURL.replace(/\/api\/?$/, '')).replace(/\/$/, '')

export function resolveAssetUrl(value) {
  if (!value) return ''
  if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:')) return value
  return `${backendBaseUrl}/${value.replace(/^\//, '')}`
}
