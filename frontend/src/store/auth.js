// src/store/auth.js

export const AUTH_CHANGE_EVENT = 'ravina:auth-change'
export const PHONE_VERIFICATION_DEFER_KEY = 'ravina_phone_verification_deferred'

const isBrowser = () => typeof window !== 'undefined'

const emitAuthChange = () => {
  if (!isBrowser()) {
    return
  }
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT))
}

const resetVerificationDeferral = () => {
  if (!isBrowser()) {
    return
  }
  sessionStorage.removeItem(PHONE_VERIFICATION_DEFER_KEY)
}

const getStorageToken = () => {
  if (!isBrowser()) {
    return null
  }
  return localStorage.getItem('jwt_token')
}

export const authStore = {
  getToken: () => getStorageToken(),

  setToken: (token) => {
    if (!isBrowser()) {
      return
    }
    localStorage.setItem('jwt_token', token)
    resetVerificationDeferral()
    emitAuthChange()
  },

  clearToken: () => {
    if (!isBrowser()) {
      return
    }
    localStorage.removeItem('jwt_token')
    resetVerificationDeferral()
    emitAuthChange()
  },

  isAuthenticated: () => !!getStorageToken(),
}
