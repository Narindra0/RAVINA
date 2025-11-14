import React from 'react'
import { Outlet, createRootRoute } from '@tanstack/react-router'

import { PhoneVerificationGate } from '../components/phone/PhoneVerificationGate'

export const rootRoute = createRootRoute({
  component: () => {
    return (
      <PhoneVerificationGate>
        <div style={{ fontFamily: 'sans-serif' }}>
          <Outlet />
        </div>
      </PhoneVerificationGate>
    )
  },
})