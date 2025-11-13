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
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
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
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1f2937' }}>
              Notifications
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              Suivez les alertes générées automatiquement pour vos plantations.
            </Typography>
          </Box>
          <Button variant="outlined" onClick={refresh}>
            Actualiser
          </Button>
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
                    p: 3,
                    backgroundColor: isUnread ? '#ecfdf5' : 'white',
                    border: '1px solid',
                    borderColor: isUnread ? 'rgba(16, 185, 129, 0.25)' : '#e5e7eb',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 1.5,
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827' }}>
                      {notification?.titre}
                    </Typography>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Chip
                        label={chipLabel}
                        color={chipColor}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                      <Typography variant="caption" sx={{ color: '#6b7280' }}>
                        {formatDateTime(notification?.dateCreation)}
                      </Typography>
                    </Stack>
                  </Box>

                  <Typography variant="body2" sx={{ color: '#374151', lineHeight: 1.6 }}>
                    {notification?.messageDetaille}
                  </Typography>

                  {isUnread && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        variant="contained"
                        sx={{ backgroundColor: '#10b981', ':hover': { backgroundColor: '#059669' } }}
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        Marquer comme lu
                      </Button>
                    </Box>
                  )}
                </Paper>
              );
            })}
          </Stack>
        )}
      </Box>
    </Box>
  );
}

