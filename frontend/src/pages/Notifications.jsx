import React, { useMemo, useState } from 'react';
import Sidebar from './Sidebar';
import {
  Box,
  IconButton,
  Typography,
  CircularProgress,
  Paper,
  Stack,
  Button,
  Chip,
  Tooltip,
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Refresh as RefreshIcon,
  NotificationsActive as NotificationsActiveIcon,
  CheckCircle as CheckCircleIcon,
  WarningAmber as WarningAmberIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useNotifications } from '../hooks/useNotifications';

const PRIORITY_COLORS = {
  URGENT: 'error',
  IMPORTANT: 'warning',
  INFO: 'info',
};

const PRIORITY_LABELS = {
  URGENT: 'Urgent',
  IMPORTANT: 'Important',
  INFO: 'Info',
};

const PRIORITY_ICONS = {
  URGENT: <WarningAmberIcon fontSize="small" />,
  IMPORTANT: <NotificationsActiveIcon fontSize="small" />,
  INFO: <InfoIcon fontSize="small" />,
};

const formatDateTime = (value) => {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
};

export default function Notifications() {
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { notifications, loading, error, markAsRead, refresh } = useNotifications({
    polling: false,
    unreadOnly: false,
  });

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => {
      const dateA = a?.dateCreation ? new Date(a.dateCreation).getTime() : 0;
      const dateB = b?.dateCreation ? new Date(b.dateCreation).getTime() : 0;
      return dateB - dateA;
    });
  }, [notifications]);

  const handleToggleSidebar = () => {
    setIsSidebarMobileOpen((prev) => !prev);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      await refresh();
    } catch (err) {
      console.error('Impossible de marquer la notification comme lue:', err);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } catch (err) {
      console.error('Erreur lors de l\'actualisation:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f7fa' }}>
      <Box
        sx={{
          display: { xs: 'block', md: 'none' },
          position: 'fixed',
          top: 10,
          left: 10,
          zIndex: 1200,
        }}
      >
        <IconButton
          color="primary"
          aria-label="open drawer"
          onClick={handleToggleSidebar}
          sx={{ backgroundColor: 'white', boxShadow: 3 }}
        >
          <MenuIcon />
        </IconButton>
      </Box>

      <Sidebar isMobileOpen={isSidebarMobileOpen} onClose={handleToggleSidebar} />

      <Box
        component="main"
        sx={{
          flex: 1,
          px: { xs: 3, md: 6 },
          py: { xs: 4, md: 6 },
          maxWidth: 1400,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
            mb: 4,
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1f2937', mb: 0.5 }}>
              Notifications
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              Suivez les alertes générées automatiquement pour vos plantations.
            </Typography>
          </Box>
          <Tooltip title="Actualiser">
            <IconButton
              onClick={handleRefresh}
              disabled={loading || isRefreshing}
              sx={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                '&:hover': {
                  backgroundColor: '#f9fafb',
                  borderColor: '#10b981',
                },
                transition: 'all 0.2s ease',
                ...(isRefreshing && {
                  animation: 'spin 1s linear infinite',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }),
              }}
            >
              <RefreshIcon sx={{ color: '#10b981' }} />
            </IconButton>
          </Tooltip>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress color="success" />
          </Box>
        ) : error ? (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              p: 4,
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              textAlign: 'center',
            }}
          >
            <Typography variant="body1">
              Une erreur est survenue lors du chargement des notifications.
            </Typography>
          </Paper>
        ) : sortedNotifications.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              p: 4,
              backgroundColor: 'white',
              textAlign: 'center',
              color: '#6b7280',
            }}
          >
            <Typography variant="body1">
              Aucune notification pour le moment. Tout est sous contrôle !
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={2.5}>
            {sortedNotifications.map((notification) => {
              const isUnread = notification?.statutLecture === false;
              const priority = notification?.niveauPriorite ?? 'INFO';
              const chipColor = PRIORITY_COLORS[priority] ?? 'info';
              const chipLabel = PRIORITY_LABELS[priority] ?? priority;

              return (
                <Paper
                  key={notification.id ?? notification['@id']}
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    p: 3.5,
                    backgroundColor: isUnread ? '#f0fdf4' : 'white',
                    border: '1px solid',
                    borderColor: isUnread ? 'rgba(16, 185, 129, 0.3)' : '#e5e7eb',
                    borderLeft: isUnread ? '4px solid #10b981' : '1px solid #e5e7eb',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      transform: 'translateY(-2px)',
                    },
                    position: 'relative',
                  }}
                >
                  {isUnread && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)',
                      }}
                    />
                  )}
                  
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: isUnread 
                          ? 'rgba(16, 185, 129, 0.1)' 
                          : 'rgba(107, 114, 128, 0.1)',
                        color: isUnread ? '#10b981' : '#6b7280',
                        flexShrink: 0,
                      }}
                    >
                      {PRIORITY_ICONS[priority] || PRIORITY_ICONS.INFO}
                    </Box>
                    
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 1.5,
                          mb: 1,
                        }}
                      >
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 700, 
                            color: '#111827',
                            fontSize: '1.1rem',
                          }}
                        >
                          {notification?.titre}
                        </Typography>
                        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                          <Chip
                            label={chipLabel}
                            color={chipColor}
                            size="small"
                            sx={{ 
                              fontWeight: 600,
                              fontSize: '0.75rem',
                            }}
                            icon={PRIORITY_ICONS[priority]}
                          />
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: '#6b7280',
                              fontSize: '0.75rem',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formatDateTime(notification?.dateCreation)}
                          </Typography>
                        </Stack>
                      </Box>

                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#374151', 
                          lineHeight: 1.7,
                          mb: isUnread ? 2 : 0,
                        }}
                      >
                        {notification?.messageDetaille}
                      </Typography>

                      {isUnread && (
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'flex-end',
                            mt: 1,
                          }}
                        >
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<CheckCircleIcon />}
                            sx={{ 
                              backgroundColor: '#10b981',
                              textTransform: 'none',
                              fontWeight: 600,
                              px: 2,
                              py: 0.75,
                              borderRadius: 2,
                              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                              '&:hover': { 
                                backgroundColor: '#059669',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                              },
                              transition: 'all 0.2s ease',
                            }}
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            Marquer comme lu
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Box>
    </Box>
  );
}

