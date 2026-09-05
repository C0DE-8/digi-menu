import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('raviMenuToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export function setSession(session) {
  localStorage.setItem('raviMenuToken', session.token)
  localStorage.setItem('raviMenuUser', JSON.stringify(session.user))
  if (session.restaurant) {
    localStorage.setItem('raviMenuRestaurant', JSON.stringify(session.restaurant))
  } else {
    localStorage.removeItem('raviMenuRestaurant')
  }
  notifySessionChanged()
}

export function clearSession() {
  const hadSession = localStorage.getItem("raviMenuToken") || localStorage.getItem("raviMenuUser") || localStorage.getItem("raviMenuRestaurant");
  localStorage.removeItem('raviMenuToken')
  localStorage.removeItem('raviMenuUser')
  localStorage.removeItem('raviMenuRestaurant')
  if (hadSession) notifySessionChanged()
}

export function getStoredUser() {
  const token = localStorage.getItem('raviMenuToken')
  const value = localStorage.getItem('raviMenuUser')
  if (!token || !value || isExpiredToken(token)) {
    clearSession()
    return null
  }

  try {
    return JSON.parse(value)
  } catch {
    clearSession()
    return null
  }
}

export function getStoredRestaurant() {
  const token = localStorage.getItem('raviMenuToken')
  const value = localStorage.getItem('raviMenuRestaurant')
  if (!token || !value || isExpiredToken(token)) return null

  try {
    return JSON.parse(value)
  } catch {
    localStorage.removeItem('raviMenuRestaurant')
    return null
  }
}

export function updateStoredRestaurant(restaurant) {
  const token = localStorage.getItem('raviMenuToken')
  if (!token || !restaurant) return
  localStorage.setItem('raviMenuRestaurant', JSON.stringify(restaurant))
  notifySessionChanged()
}

function isExpiredToken(token) {
  try {
    const payload = JSON.parse(window.atob(token.split('.')[1]))
    return payload.exp ? payload.exp * 1000 <= Date.now() : false
  } catch {
    return true
  }
}

function notifySessionChanged() {
  window.dispatchEvent(new Event('raviMenuSessionChanged'))
}

export default api
