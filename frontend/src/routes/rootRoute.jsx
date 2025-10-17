import React from 'react'
import { Outlet, Link, createRootRoute } from '@tanstack/react-router'
import { authStore } from '../store/auth'

export const rootRoute = createRootRoute({
  component: () => (
    <div style={{ padding: '1rem', fontFamily: 'sans-serif' }}>
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
      <Outlet />
    </div>
  ),
})
