import React from 'react';
import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  IconButton,
  Fade,
} from '@mui/material';
import { ErrorOutline, Close } from '@mui/icons-material';

export function ErrorModal({ open, onClose, title, message, severity = 'error' }) {
  const getIconColor = () => {
    switch (severity) {
      case 'error':
        return '#ff3b30'; // Rouge iPhone
      case 'warning':
        return '#ff9500'; // Orange iPhone
      default:
        return '#ff3b30';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth={false}
      PaperProps={{
        sx: {
          borderRadius: '20px',
          boxShadow: 'none',
          overflow: 'hidden',
          maxWidth: '320px',
          width: '100%',
          margin: 'auto',
        },
      }}
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 300 }}
      sx={{
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(8px)',
        },
      }}
    >
      <Box
        sx={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderRadius: '20px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Barre de notification en haut (style iPhone) */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '36px',
            height: '5px',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '0 0 3px 3px',
            zIndex: 1,
          }}
        />

        <DialogContent
          sx={{
            p: 0,
            position: 'relative',
          }}
        >
          {/* Contenu principal */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              p: 3,
              pt: 4,
            }}
          >
            {/* Icône d'erreur */}
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                backgroundColor: `${getIconColor()}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
                animation: 'pulse 0.6s ease-out',
                '@keyframes pulse': {
                  '0%': {
                    transform: 'scale(0.8)',
                    opacity: 0,
                  },
                  '50%': {
                    transform: 'scale(1.1)',
                  },
                  '100%': {
                    transform: 'scale(1)',
                    opacity: 1,
                  },
                },
              }}
            >
              <ErrorOutline
                sx={{
                  fontSize: 28,
                  color: getIconColor(),
                }}
              />
            </Box>

            {/* Titre */}
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                fontSize: '1.1rem',
                color: '#1d1d1f',
                mb: 0.75,
                lineHeight: 1.3,
              }}
            >
              {title || 'Erreur de connexion'}
            </Typography>

            {/* Message */}
            <Typography
              variant="body1"
              sx={{
                color: '#6e6e73',
                fontSize: '0.875rem',
                lineHeight: 1.5,
                maxWidth: '90%',
                mb: 2.5,
              }}
            >
              {message}
            </Typography>

            {/* Bouton de fermeture */}
            <Box
              component="button"
              onClick={onClose}
              sx={{
                backgroundColor: getIconColor(),
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                px: 3,
                py: 1,
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minWidth: '100px',
                '&:hover': {
                  backgroundColor: severity === 'error' ? '#d70015' : '#e68900',
                  transform: 'scale(1.02)',
                },
                '&:active': {
                  transform: 'scale(0.98)',
                },
              }}
            >
              J'ai compris
            </Box>
          </Box>
        </DialogContent>

        {/* Bouton de fermeture en haut à droite (optionnel) */}
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            color: '#8e8e93',
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            width: 28,
            height: 28,
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.08)',
              color: '#1d1d1f',
            },
          }}
        >
          <Close sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>
    </Dialog>
  );
}

