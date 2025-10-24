import React from 'react'
import { Box, Typography, Button, Divider } from '@mui/material'
import { Home, Logout } from '@mui/icons-material'
import { authStore } from '../store/auth'

// Import de votre logo
import orientMadaLogo from '../assets/logo-texte.png'

const sidebarStyles = {
  sidebar: {
    width: 280,
    minHeight: '100vh',
    backgroundColor: 'white',
    borderRight: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    height: '100vh',
    // Responsive: cache sur mobile
    display: { xs: 'none', md: 'flex' },
  },

  logoContainer: {
    p: 3,
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoImage: {
    height: 60,
    width: 'auto',
    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
  },

  // Alternative si vous voulez un logo texte stylisé
  logoText: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#10b981',
    fontFamily: 'cursive',
    display: 'flex',
    alignItems: 'center',
    gap: 1,
  },

  nav: {
    flex: 1,
    p: 2,
  },

  navButton: {
    width: '100%',
    justifyContent: 'flex-start',
    px: 3,
    py: 1.5,
    mb: 1,
    borderRadius: 2,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    color: '#10b981',
    fontWeight: 600,
    textTransform: 'none',
    fontSize: '1rem',
    gap: 2,
    '&:hover': {
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
    },
  },

  footer: {
    p: 2,
    borderTop: '1px solid #e5e7eb',
  },

  logoutButton: {
    width: '100%',
    justifyContent: 'flex-start',
    px: 3,
    py: 1.5,
    borderRadius: 2,
    color: '#dc2626',
    fontWeight: 600,
    textTransform: 'none',
    fontSize: '1rem',
    gap: 2,
    '&:hover': {
      backgroundColor: 'rgba(220, 38, 38, 0.05)',
    },
  },

  userInfo: {
    px: 2,
    py: 1.5,
    mb: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 2,
  },

  userEmail: {
    fontSize: '0.875rem',
    color: '#6b7280',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
}

export default function Sidebar({ user }) {
  const handleLogout = () => {
    authStore.clearToken()
    window.location.href = '/login'
  }

  return (
    <Box sx={sidebarStyles.sidebar}>
      {/* Logo Section */}
      <Box sx={sidebarStyles.logoContainer}>
        {/* Option 1: Image du logo */}
        <img
          src={orientMadaLogo}
          alt="OrientMada Logo"
          style={sidebarStyles.logoImage}
        />
        
        {/* Option 2: Logo texte stylisé (décommentez si vous préférez) */}
        {/* <Typography sx={sidebarStyles.logoText}>
          🌱 Plants
        </Typography> */}
      </Box>

      {/* Navigation Section */}
      <Box sx={sidebarStyles.nav}>
        {/* User Info (optionnel) */}
        {user && (
          <Box sx={sidebarStyles.userInfo}>
            <Typography variant="body2" sx={sidebarStyles.userEmail}>
              {user.email}
            </Typography>
          </Box>
        )}

        {/* Dashboard Button (actif) */}
        <Button sx={sidebarStyles.navButton}>
          <Home sx={{ fontSize: 22 }} />
          Dashboard
        </Button>

        {/* Vous pouvez ajouter d'autres boutons ici */}
        {/* <Button sx={{ ...sidebarStyles.navButton, backgroundColor: 'transparent', color: '#6b7280' }}>
          <Settings sx={{ fontSize: 22 }} />
          Paramètres
        </Button> */}
      </Box>

      {/* Footer - Logout Button */}
      <Box sx={sidebarStyles.footer}>
        <Button 
          onClick={handleLogout}
          sx={sidebarStyles.logoutButton}
        >
          <Logout sx={{ fontSize: 22 }} />
          Déconnexion
        </Button>
      </Box>
    </Box>
  )
}