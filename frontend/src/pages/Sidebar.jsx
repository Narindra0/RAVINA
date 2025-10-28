import React from 'react'
import { 
    Box, 
    Typography, 
    Button, 
    // 🚨 Import de Drawer pour la gestion mobile
    Drawer 
} from '@mui/material'
import { Home, Logout } from '@mui/icons-material'
import { authStore } from '../store/auth'

// Import de votre logo
import orientMadaLogo from '../assets/logo-texte.png'

const sidebarStyles = {
  // 🚀 NOUVEAU: Conteneur de base pour le contenu (partagé par Box et Drawer)
  sidebarContentBase: {
    width: 280,
    minHeight: '100vh',
    backgroundColor: 'white',
    display: 'flex',         // 👈 Active Flexbox
    flexDirection: 'column', // 👈 Empile verticalement
    height: '100vh',         // 👈 Hauteur de la vue (viewport)
  },
  
  // 🚨 L'ancien style 'sidebar' est supprimé et sa logique est divisée 
  // entre sidebarContentBase et les deux éléments JSX (Box et Drawer).

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

  // 🚀 SECTION CLÉ : Ce bloc prend tout l'espace restant et pousse le footer en bas
  nav: {
    flex: 1, // 👈 🚨 C'EST LA PROPRIÉTÉ QUI FORCE LE BOUTON DE DÉCONNEXION EN BAS
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

// 🚨 NOUVELLES PROPS : isMobileOpen et onClose pour le contrôle mobile
export default function Sidebar({ user, isMobileOpen, onClose }) {
  const handleLogout = () => {
    authStore.clearToken()
    window.location.href = '/login'
  }

  // Contenu de la barre latérale - Réutilisable pour la vue Desktop et Mobile
  const sidebarContent = (
    // Ce conteneur utilise sidebarContentBase avec display:flex et flexDirection:column
    <Box sx={sidebarStyles.sidebarContentBase}> 
      {/* 1. Logo Section */}
      <Box sx={sidebarStyles.logoContainer}>
        <img
          src={orientMadaLogo}
          alt="OrientMada Logo"
          style={sidebarStyles.logoImage}
        />
      </Box>

      {/* 2. Navigation Section (S'étire au maximum) */}
      <Box sx={sidebarStyles.nav}>
        {user && (
          <Box sx={sidebarStyles.userInfo}>
            <Typography variant="body2" sx={sidebarStyles.userEmail}>
              {user.email}
            </Typography>
          </Box>
        )}

        {/* Dashboard Button */}
        <Button 
            sx={sidebarStyles.navButton}
            onClick={onClose} // Ferme le Drawer si un lien est cliqué sur mobile
        >
          <Home sx={{ fontSize: 22 }} />
          Dashboard
        </Button>
      </Box>

      {/* 3. Footer - Bouton Déconnexion (Poussé tout en bas) */}
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

  return (
    <>
      {/* 1. Vue Desktop (Box Normale Fixée) */}
      <Box 
        sx={{
            display: { xs: 'none', md: 'flex' }, // Visible uniquement sur MD+
            
            // 🚀 Styles pour la fixation complète sur grand écran
            position: 'sticky', 
            top: 0,
            height: '100vh', 
            
            // Reprise des styles de dimension et d'apparence
            width: 280,
            minHeight: '100vh',
            backgroundColor: 'white',
            borderRight: '1px solid #e5e7eb', 
            flexDirection: 'column',
        }}
      >
        {sidebarContent} 
      </Box>

      {/* 2. Vue Mobile (Drawer MUI) */}
      <Drawer
        variant="temporary" // Comportement de tiroir
        open={isMobileOpen} // Contrôlé par l'état dans Dashboard.jsx
        onClose={onClose} // Fonction pour fermer
        ModalProps={{
          keepMounted: true, 
        }}
        sx={{
          display: { xs: 'block', md: 'none' }, // Visible uniquement sur XS
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280 }, 
        }}
      >
        {sidebarContent}
      </Drawer>
    </>
  )
}