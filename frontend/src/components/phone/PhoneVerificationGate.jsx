import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'

import { api } from '../../lib/axios'
import { authStore, AUTH_CHANGE_EVENT, PHONE_VERIFICATION_DEFER_KEY } from '../../store/auth'
import { PhoneVerificationModal } from './PhoneVerificationModal'

const initialStatus = {
  numeroTelephone: '',
  phoneVerified: true,
}

const hasDeferredFlag = () =>
  typeof window !== 'undefined' && sessionStorage.getItem(PHONE_VERIFICATION_DEFER_KEY) === '1'

const setDeferredFlag = () => {
  if (typeof window === 'undefined') {
    return
  }
  sessionStorage.setItem(PHONE_VERIFICATION_DEFER_KEY, '1')
}

const clearDeferredFlag = () => {
  if (typeof window === 'undefined') {
    return
  }
  sessionStorage.removeItem(PHONE_VERIFICATION_DEFER_KEY)
}

export function PhoneVerificationGate({ children }) {
  const [status, setStatus] = useState(initialStatus)
  const [modalOpen, setModalOpen] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const routerState = useRouterState()
  const mountedRef = useRef(true)

  const refreshStatus = useCallback(async () => {
    if (!authStore.isAuthenticated()) {
      if (!mountedRef.current) return
      setStatus(initialStatus)
      setModalOpen(false)
      return
    }

    setIsFetching(true)
    try {
      const response = await api.get('/user')
      const phoneVerified = Boolean(response.data?.phoneVerified)
      const numeroTelephone = response.data?.numeroTelephone ?? ''

      if (!mountedRef.current) {
        return
      }

      setStatus({
        phoneVerified,
        numeroTelephone,
      })
      setModalOpen(!phoneVerified && !hasDeferredFlag())
    } catch (error) {
      if (error.response?.status === 401) {
        authStore.clearToken()
      }
      console.error('Erreur lors de la vérification du profil utilisateur', error)
    } finally {
      if (mountedRef.current) {
        setIsFetching(false)
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    refreshStatus()

    return () => {
      mountedRef.current = false
    }
  }, [refreshStatus])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const handler = () => {
      refreshStatus()
    }

    window.addEventListener(AUTH_CHANGE_EVENT, handler)
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, handler)
  }, [refreshStatus])

  useEffect(() => {
    refreshStatus()
  }, [routerState.location.pathname, refreshStatus])

  const handleDeferred = () => {
    setDeferredFlag()
    setModalOpen(false)
  }

  const handleVerified = () => {
    clearDeferredFlag()
    setStatus((prev) => ({
      ...prev,
      phoneVerified: true,
    }))
    setModalOpen(false)
  }

  const shouldDisplayModal = !status.phoneVerified && !hasDeferredFlag()

  return (
    <>
      {children}
      {authStore.isAuthenticated() && (
        <PhoneVerificationModal
          open={modalOpen && shouldDisplayModal && !isFetching}
          defaultPhoneNumber={status.numeroTelephone}
          onDefer={handleDeferred}
          onVerified={() => {
            handleVerified()
            refreshStatus()
          }}
          onStatusRefresh={refreshStatus}
        />
      )}
    </>
  )
}

