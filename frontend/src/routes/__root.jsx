import React from 'react'
import { Outlet, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (
    <div>
      <h1>🌿 Application OrientMada</h1>
      <Outlet />
    </div>
  ),
})
