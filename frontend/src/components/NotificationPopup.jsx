import React from 'react'
import {
  Snackbar,
  Paper,
  Stack,
  Typography,
  Button,
  IconButton,
  Box,
} from '@mui/material'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import InfoIcon from '@mui/icons-material/Info'
import CloseIcon from '@mui/icons-material/Close'

const PRIORITY_STYLES = {
  URGENT: {
    icon: WarningAmberIcon,
    badge: 'Urgent',
    colors: {
      bg: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
      border: '#fecaca',
      accent: '#dc2626',
    },
  },
  IMPORTANT: {
    icon: NotificationsActiveIcon,
    badge: 'Important',
    colors: {
      bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
      border: '#fde68a',
      accent: '#d97706',
    },
  },
  INFO: {
    icon: InfoIcon,
    badge: 'Information',
    colors: {
      bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
      border: '#bfdbfe',
      accent: '#2563eb',
    },
  },
}

export default function NotificationPopup({ notification, onAcknowledge, onClose }) {
  if (!notification) {
    return null
  }

  const { id, titre, messageDetaille, niveauPriorite } = notification
  const priority = PRIORITY_STYLES[niveauPriorite] || PRIORITY_STYLES.INFO
  const Icon = priority.icon
  const { bg, border, accent } = priority.colors
  const autoHideDuration = 5000

  const handleClose = (_, reason) => {
    if (reason === 'clickaway') {
      return
    }
    onClose?.(notification.id, reason || 'manual')
  }

  const handleMarkAsRead = () => {
    onAcknowledge?.(id, 'ack')
  }

  return (
    <Snackbar
      open
      autoHideDuration={autoHideDuration}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      onClose={handleClose}
    >
      <Paper
        elevation={8}
        sx={{
          p: 2,
          borderRadius: 3,
          minWidth: { xs: 320, md: 380 },
          border: `1px solid ${border}`,
          background: bg,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accent,
              flexShrink: 0,
            }}
          >
            <Icon fontSize="small" />
          </Box>
          <Stack spacing={1} flex={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
              <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                {titre}
              </Typography>
              <Typography variant="caption" sx={{ color: accent, fontWeight: 700, textTransform: 'uppercase' }}>
                {priority.badge}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {messageDetaille}
            </Typography>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button variant="text" size="small" onClick={handleMarkAsRead} sx={{ fontWeight: 600 }}>
                Marquer comme lu
              </Button>
              <IconButton size="small" onClick={() => onClose?.(notification.id, 'manual-button')}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
        </Stack>
      </Paper>
    </Snackbar>
  )
}

