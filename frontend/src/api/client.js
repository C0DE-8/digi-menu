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
  if (session.restaurant) {
    localStorage.setItem('digiMenuRestaurant', JSON.stringify(session.restaurant))
  } else {
    localStorage.removeItem('digiMenuRestaurant')
  }
  notifySessionChanged()
}

export function clearSession() {
  localStorage.removeItem('digiMenuToken')
  localStorage.removeItem('digiMenuUser')
  localStorage.removeItem('digiMenuRestaurant')
  notifySessionChanged()
}

export function getStoredUser() {
  const token = localStorage.getItem('digiMenuToken')
  const value = localStorage.getItem('digiMenuUser')
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
  const token = localStorage.getItem('digiMenuToken')
  const value = localStorage.getItem('digiMenuRestaurant')
  if (!token || !value || isExpiredToken(token)) return null

  try {
    return JSON.parse(value)
  } catch {
    localStorage.removeItem('digiMenuRestaurant')
    return null
  }
}

export function updateStoredRestaurant(restaurant) {
  const token = localStorage.getItem('digiMenuToken')
  if (!token || !restaurant) return
  localStorage.setItem('digiMenuRestaurant', JSON.stringify(restaurant))
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
  window.dispatchEvent(new Event('digiMenuSessionChanged'))
}

export default api
