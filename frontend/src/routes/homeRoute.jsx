import React from 'react'
import { createRoute } from '@tanstack/react-router'
import { rootRoute } from './rootRoute'

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <div>Bienvenue sur la page d’accueil 🌞</div>,
})
