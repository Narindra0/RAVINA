import React from 'react'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { rootRoute } from './rootRoute'
import { homeRoute } from './homeRoute'
import { loginRoute } from './loginRoute'
import { registerRoute } from './registerRoute'
import { dashboardRoute } from './dashboardRoute'
import { plantsRoute } from './plantsRoute' // 👈 import ajouté

const routeTree = rootRoute.addChildren([
  homeRoute,
  loginRoute,
  registerRoute,
  dashboardRoute,
  plantsRoute, // 👈 route ajoutée ici
])

const router = createRouter({ routeTree })

export function AppRouter() {
  return <RouterProvider router={router} />
}
