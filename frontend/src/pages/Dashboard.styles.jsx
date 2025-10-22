// Dashboard.styles.js

// Réutilisation des couleurs principales pour la cohérence
export const PRIMARY_GREEN = '#2e7d32';
export const DARK_GREEN = '#1b5e20';
export const LIGHT_GREEN = '#4caf50';
export const BACKGROUND_COLOR = '#f8f9fa';
export const ACCENT_ORANGE = '#ff9800';
export const ACCENT_ORANGE_LIGHT = '#ffb74d';

export const dashboardStyles = {
  // --- Global Layout ---
  root: {
    minHeight: '100vh',
    fontFamily: 'Poppins, Arial, sans-serif',
    pb: 6,
    background: `linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 50%, #fff8e1 100%)`,
  },
  
  // --- App Bar / Header ---
  appBar: {
    background: `linear-gradient(135deg, ${PRIMARY_GREEN} 0%, ${LIGHT_GREEN} 100%)`,
    boxShadow: '0 8px 24px rgba(46, 125, 50, 0.25)',
  },
  
  title: {
    flexGrow: 1,
    fontWeight: 700,
  },
  
  avatar: {
    bgcolor: ACCENT_ORANGE,
    width: 36,
    height: 36,
    fontSize: 14,
    mr: 1.2,
    boxShadow: '0 8px 18px rgba(255, 152, 0, 0.35)'
  },
  
  logoutButton: {
    color: 'white',
    '&:hover': {
        bgcolor: DARK_GREEN,
    }
  },
  
  // --- Main Content ---
  container: {
    py: { xs: 3, sm: 5 },
  },
  
  welcomeText: {
    fontWeight: 600,
    color: PRIMARY_GREEN,
    mb: 1,
    fontSize: { xs: '1.7rem', sm: '2.5rem' }
  },
  
  // --- Card Styles ---
  mainCard: {
    borderRadius: 3,
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)',
    background: '#ffffff',
  },

  // --- Suggestions Section ---
  suggestionsCard: {
    background: '#ffffff',
    border: `1px solid rgba(46, 125, 50, 0.12)`,
  },
  
  suggestionHeaderIcon: {
    fontSize: { xs: 35, sm: 45 },
    mr: 2,
    color: DARK_GREEN,
  },
  
  suggestionItemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 2,
    p: 1.5,
    textAlign: 'left',
    borderLeft: `4px solid ${ACCENT_ORANGE}`,
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.06)'
  },

  // --- Plants Section ---
  plantsCard: {
    border: `1px solid rgba(76, 175, 80, 0.25)`,
    '&:hover': { transform: 'translateY(-2px)' }
  },

  plantItemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 2.5,
    p: 2,
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: 0.75,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
    border: '1px solid rgba(0,0,0,0.06)'
  },
  
  plantName: {
    fontWeight: 600,
    color: PRIMARY_GREEN,
  },

  plantBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.5,
    px: 1,
    py: 0.3,
    borderRadius: 999,
    fontSize: '0.75rem',
    fontWeight: 600,
    backgroundColor: 'rgba(46,125,50,0.08)',
    color: DARK_GREEN,
  },

  plantMetricsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 1,
    mt: 1,
  },

  plantMetric: {
    display: 'flex',
    alignItems: 'center',
    gap: 0.5,
    color: '#6c757d',
    fontSize: '0.9rem',
  },

  cardActionsRow: {
    display: 'none'
  },

  smallGhostButton: {
    textTransform: 'none',
    px: 1.5,
    py: 0.6,
    borderRadius: 2,
    color: PRIMARY_GREEN,
    borderColor: PRIMARY_GREEN,
    '&:hover': { borderColor: DARK_GREEN, backgroundColor: 'rgba(46,125,50,0.05)' }
  },
  
  addPlantButton: {
    py: 1.2,
    mt: 3,
    background: `linear-gradient(135deg, ${PRIMARY_GREEN} 0%, ${LIGHT_GREEN} 100%)`,
    color: 'white',
    fontWeight: 700,
    textTransform: 'none',
    '&:hover': {
      background: `linear-gradient(135deg, ${DARK_GREEN} 0%, ${PRIMARY_GREEN} 100%)`,
      transform: 'translateY(-1px)',
      boxShadow: '0 8px 24px rgba(46, 125, 50, 0.35)'
    },
    transition: 'all 0.3s ease'
  }
};