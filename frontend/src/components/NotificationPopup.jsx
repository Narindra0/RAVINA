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
  const autoHideDuration = niveauPriorite === 'URGENT' ? null : 8000;

  const handleClose = (_, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    onClose?.(id);
  };

  const handleAcknowledge = () => {
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
          <Button color="inherit" size="small" onClick={handleAcknowledge}>
            Compris
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

