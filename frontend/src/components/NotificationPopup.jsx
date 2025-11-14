import React from 'react';
import { Alert, Button, Snackbar, Stack, Typography } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import InfoIcon from '@mui/icons-material/Info';

const PRIORITY_ICON = {
  URGENT: <WarningAmberIcon fontSize="inherit" />,
  IMPORTANT: <NotificationsActiveIcon fontSize="inherit" />,
  INFO: <InfoIcon fontSize="inherit" />,
};

const PRIORITY_SEVERITY = {
  URGENT: 'error',
  IMPORTANT: 'warning',
  INFO: 'info',
};

export default function NotificationPopup({ notification, onAcknowledge, onClose }) {
  if (!notification) {
    return null;
  }

  const { id, titre, messageDetaille, niveauPriorite } = notification;
  const severity = PRIORITY_SEVERITY[niveauPriorite] || 'info';
  const icon = PRIORITY_ICON[niveauPriorite] || PRIORITY_ICON.INFO;
  // La notification s'affiche 3 secondes puis se ferme automatiquement sans marquer comme lue
  const autoHideDuration = 3000;

  const handleClose = (_, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    // Fermeture automatique après 3s : on ferme juste la popup sans marquer comme lue
    // onClose est appelé avec null pour indiquer qu'on ne marque pas comme lue
    onClose?.(null);
  };

  const handleMarkAsRead = () => {
    // L'utilisateur clique explicitement sur "Marquer comme lu"
    onAcknowledge?.(id);
  };

  return (
    <Snackbar
      open
      autoHideDuration={autoHideDuration}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      onClose={handleClose}
    >
      <Alert
        severity={severity}
        icon={icon}
        sx={{ alignItems: 'flex-start', minWidth: { xs: 'auto', md: 360 } }}
        action={
          <Button color="inherit" size="small" onClick={handleMarkAsRead}>
            Marquer comme lu
          </Button>
        }
      >
        <Stack spacing={0.5}>
          <Typography variant="subtitle1" fontWeight={600}>
            {titre}
          </Typography>
          <Typography variant="body2">{messageDetaille}</Typography>
        </Stack>
      </Alert>
    </Snackbar>
  );
}

