import React, { useEffect, useState } from 'react'
import { 
    Box, 
    Typography, 
    Button, 
    Drawer,
    Badge,
} from '@mui/material'
import { Home, Logout, Cloud, LocalFlorist, Notifications as NotificationsIcon } from '@mui/icons-material'
// 🚨 CORRECTION: Utilisation des hooks et composants de TanStack Router
import { Link, useRouterState } from '@tanstack/react-router' 

import { authStore } from '../store/auth'
import NotificationPopup from '../components/NotificationPopup'
import { useNotifications } from '../hooks/useNotifications'

// Import de votre logo
import orientMadaLogo from '../assets/logo-texte.png'

const sidebarStyles = {
  sidebarContentBase: {
    width: 280,
    minHeight: '100vh',
    backgroundColor: 'white',
    display: 'flex',         
    flexDirection: 'column', 
    height: '100vh',         
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

  nav: {
    flex: 1, 
    p: 2,
  },

  // 💡 Nouveau style de base pour le Link de TanStack
  tanstackLinkBase: {
    textDecoration: 'none', 
    color: 'inherit',
    display: 'block', 
  },

  navButton: (isActive) => ({
    width: '100%',
    justifyContent: 'flex-start',
    px: 3,
    py: 1.5,
    mb: 1,
    borderRadius: 2,
    backgroundColor: isActive ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
    color: isActive ? '#059669' : '#4b5563', 
    fontWeight: isActive ? 700 : 600,
    textTransform: 'none',
    fontSize: '1rem',
    gap: 2,
    '&:hover': {
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      color: '#059669',
    },
  }),

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

export default function Sidebar({ user, isMobileOpen, onClose }) {
  // 🚨 CORRECTION: Utilisation de useRouterState pour obtenir le chemin actuel
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname; 
  const { notifications, markAsRead, unreadCount, refresh } = useNotifications({ polling: true, unreadOnly: true });
  const [activeNotification, setActiveNotification] = useState(null);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState([]);

  useEffect(() => {
    setDismissedNotificationIds((ids) => ids.filter((id) => notifications?.some((item) => item.id === id)));
  }, [notifications]);

  useEffect(() => {
    if (!notifications || notifications.length === 0) {
      setActiveNotification(null);
      return;
    }
    const nextNotification = notifications.find((item) => !dismissedNotificationIds.includes(item.id));
    setActiveNotification(nextNotification || null);
  }, [notifications, dismissedNotificationIds]);

  const handleNotificationDismiss = async (id, reason) => {
    const targetId = id || activeNotification?.id;
    if (!targetId) {
      setActiveNotification(null);
      return;
    }

    if (reason === 'ack') {
      try {
        await markAsRead(targetId);
        await refresh();
      } catch (error) {
        console.error('Erreur lors de la confirmation de la notification:', error);
      } finally {
        setDismissedNotificationIds((ids) => ids.filter((dismissedId) => dismissedId !== targetId));
        setActiveNotification(null);
      }
      return;
    }

    setDismissedNotificationIds((ids) =>
      ids.includes(targetId) ? ids : [...ids, targetId]
    );
    setActiveNotification(null);
  };

  const handleLogout = () => {
    // Nettoyer le token d'authentification
    authStore.clearToken()
    
    // Nettoyer toute autre donnée en session si nécessaire
    // (le clearToken nettoie déjà le phone verification deferral)
    
    // Rediriger vers la page de login avec un rechargement complet
    // pour s'assurer que toutes les données sont bien réinitialisées
    window.location.href = '/login'
  }
  
  const isPathActive = (path) => currentPath === path || (path === '/' && currentPath === '/');

  const sidebarContent = (
    <Box sx={sidebarStyles.sidebarContentBase}> 
      {/* 1. Logo Section */}
      <Box sx={sidebarStyles.logoContainer}>
        <img
          src={orientMadaLogo}
          alt="OrientMada Logo"
          style={sidebarStyles.logoImage}
        />
      </Box>

      {/* 2. Navigation Section */}
      <Box sx={sidebarStyles.nav}>
        {user && (
          <Box sx={sidebarStyles.userInfo}>
            <Typography variant="body2" sx={sidebarStyles.userEmail}>
              {user.email}
            </Typography>
          </Box>
        )}

        {/* Dashboard Button */}
        {/* 🚨 Utilisation du composant Link de TanStack */}
        <Link to="/dashboard" style={sidebarStyles.tanstackLinkBase} onClick={onClose}>
            <Button 
                sx={sidebarStyles.navButton(isPathActive('/'))}
            >
              <Home sx={{ fontSize: 22 }} />
              Dashboard
            </Button>
        </Link>
        
        {/* Bouton Météo */}
        {/* 🚨 Utilisation du composant Link de TanStack */}
        <Link to="/meteo" style={sidebarStyles.tanstackLinkBase} onClick={onClose}>
            <Button 
                sx={sidebarStyles.navButton(isPathActive('/meteo'))}
            >
              <Cloud sx={{ fontSize: 22 }} />
              Météo Détaillée
            </Button>
        </Link>

        {/* Bouton Plantations */}
        {/* 🚨 Utilisation du composant Link de TanStack */}
        <Link to="/plantations" style={sidebarStyles.tanstackLinkBase} onClick={onClose}>
            <Button 
                sx={sidebarStyles.navButton(isPathActive('/plantations'))}
            >
              <LocalFlorist sx={{ fontSize: 22 }} />
              Plantations
            </Button>
        </Link>

        <Link to="/notifications" style={sidebarStyles.tanstackLinkBase} onClick={onClose}>
            <Button 
                sx={sidebarStyles.navButton(isPathActive('/notifications'))}
            >
              <Badge 
                badgeContent={unreadCount} 
                color="error" 
                overlap="circular" 
                max={99}
                invisible={!unreadCount}
              >
                <NotificationsIcon sx={{ fontSize: 22 }} />
              </Badge>
              Notifications
            </Button>
        </Link>

      </Box>

      {/* 3. Footer - Bouton Déconnexion */}
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
            display: { xs: 'none', md: 'flex' },
            position: 'sticky', 
            top: 0,
            height: '100vh', 
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
        variant="temporary"
        open={isMobileOpen}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, 
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280 }, 
        }}
      >
        {sidebarContent}
      </Drawer>

      <NotificationPopup
        notification={activeNotification}
        onAcknowledge={handleNotificationDismiss}
        onClose={handleNotificationDismiss}
      />
    </>
  )
}