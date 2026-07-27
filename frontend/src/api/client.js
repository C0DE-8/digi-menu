import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5050/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('digiMenuToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export function setSession(session) {
  localStorage.setItem('digiMenuToken', session.token)
  localStorage.setItem('digiMenuUser', JSON.stringify(session.user))
}

export function clearSession() {
  localStorage.removeItem('digiMenuToken')
  localStorage.removeItem('digiMenuUser')
}

export function getStoredUser() {
  const value = localStorage.getItem('digiMenuUser')
  return value ? JSON.parse(value) : null
}

export default api
