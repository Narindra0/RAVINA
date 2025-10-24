import React from 'react'
import { Outlet, createRootRoute } from '@tanstack/react-router' // useLocation n'est plus nécessaire

// Le store d'auth est toujours importé, même si les liens de déconnexion sont partis,
// si d'autres parties du layout en ont besoin (ce n'est pas le cas ici, mais bonne pratique)
// import { authStore } from '../store/auth' 

export const rootRoute = createRootRoute({
  component: () => {
    // Les variables location et isAuthPage ne sont plus nécessaires
    // const location = useLocation()
    // const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

    return (
      <div style={{ fontFamily: 'sans-serif' }}>
        
        {/* ⚠️ La navigation conditionnelle ET la balise <nav> ont été supprimées. */}
        
        <Outlet />
      </div>
    )
  },
})