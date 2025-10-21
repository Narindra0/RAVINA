import React from 'react'
import { Outlet, Link, createRootRoute, useLocation } from '@tanstack/react-router' // 👈 useLocation a été ajouté ici
import { authStore } from '../store/auth'

export const rootRoute = createRootRoute({
  component: () => {
    const location = useLocation()
    
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

    return (
      <div style={{ fontFamily: 'sans-serif' }}>
        
        {/* 3. Condition : On affiche la navigation SEULEMENT si ce n'est PAS une page d'authentification */}
        {!isAuthPage && (
          <nav style={{ marginBottom: '1rem' }}>
            <Link to="/">Accueil</Link> |{' '}
            <Link to="/login">Login</Link> |{' '}
            <Link to="/register">Register</Link> |{' '}
            <Link to="/dashboard">Dashboard</Link> |{' '}
            {authStore.isAuthenticated() && (
              <button
                onClick={() => {
                  authStore.clearToken()
                  window.location.href = '/login'
                }}
              >
                Logout
              </button>
            )}
          </nav>
        )}
        <Outlet />
      </div>
    )
  },
})