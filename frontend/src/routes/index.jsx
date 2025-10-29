import React from 'react'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { rootRoute } from './rootRoute'
import { homeRoute } from './homeRoute'
import { loginRoute } from './loginRoute'
import { registerRoute } from './registerRoute'
import { dashboardRoute } from './dashboardRoute'
import { plantsRoute } from './plantsRoute'
import { meteoRoute } from './meteoRoute' // ✅ ajouté ici

const routeTree = rootRoute.addChildren([
  homeRoute,
  loginRoute,
  registerRoute,
  dashboardRoute,
  plantsRoute,
  meteoRoute, // ✅ ajouté ici aussi
])

const router = createRouter({ routeTree })

export function AppRouter() {
  return <RouterProvider router={router} />
}
