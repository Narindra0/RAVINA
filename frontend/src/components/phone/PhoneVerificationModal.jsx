import React, { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  InputAdornment,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material'
import { Phone as PhoneIcon } from '@mui/icons-material'

import { api } from '../../lib/axios'
import { useSnackbar } from '../../hooks/useSnackbar'
import { SnackbarAlert } from '../ui/SnackbarAlert'

const COUNTRY_PREFIX = '+261'
const SUFFIX_LENGTH = 9

const sanitizeDigits = (value = '') => value.replace(/\D+/g, '')

const extractSuffix = (value = '') => {
  const digits = sanitizeDigits(value)
  if (!digits) {
    return ''
  }

  let withoutPrefix = digits
  if (withoutPrefix.startsWith('261')) {
    withoutPrefix = withoutPrefix.slice(3)
  }
  if (withoutPrefix.startsWith('0') && withoutPrefix.length === 10) {
    withoutPrefix = withoutPrefix.slice(1)
  }

  return withoutPrefix.slice(0, SUFFIX_LENGTH)
}

export function PhoneVerificationModal({
  open,
  defaultPhoneNumber = '',
  onDefer,
  onVerified,
  onStatusRefresh,
}) {
  const [phoneSuffix, setPhoneSuffix] = useState('')
  const [saving, setSaving] = useState(false)

  const { showSnackbar, ...snackbarProps } = useSnackbar()

  const isPhoneValid = useMemo(() => sanitizeDigits(phoneSuffix).length === SUFFIX_LENGTH, [phoneSuffix])

  useEffect(() => {
    if (!open) {
      setPhoneSuffix('')
      return
    }
    setPhoneSuffix(extractSuffix(defaultPhoneNumber))
  }, [open, defaultPhoneNumber])

  const handleDialogClose = (_, reason) => {
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      return
    }
    handleDefer()
  }

  const handlePhoneChange = (event) => {
    const digits = sanitizeDigits(event.target.value).slice(0, SUFFIX_LENGTH)
    setPhoneSuffix(digits)
  }

  const handleSave = async () => {
    if (!isPhoneValid) {
      return
    }

    setSaving(true)

    try {
      await api.post('/phone/save', {
        phoneSuffix: sanitizeDigits(phoneSuffix),
      })
      showSnackbar('✅ Numéro enregistré avec succès !', 'success')
      onStatusRefresh?.()
      onVerified?.()
    } catch (error) {
      const message = error.response?.data?.error || "Impossible d'enregistrer le numéro pour le moment."
      showSnackbar(message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDefer = () => {
    onDefer?.()
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={handleDialogClose}
        fullWidth
        maxWidth="sm"
        aria-labelledby="phone-verification-title"
        disableRestoreFocus
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          },
        }}
      >
        <DialogTitle
          id="phone-verification-title"
          sx={{
            pb: 1,
            pt: 3,
            px: 3,
            fontSize: '1.5rem',
            fontWeight: 600,
            color: '#111827',
          }}
        >
          Ajoutez votre numéro de téléphone
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 2 }}>
          <Stack spacing={3}>
            <Alert
              severity="info"
              icon={<PhoneIcon />}
              sx={{
                borderRadius: 2,
                backgroundColor: '#eff6ff',
                color: '#1e40af',
                '& .MuiAlert-icon': {
                  color: '#3b82f6',
                },
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Cette étape garantit que nous pouvons vous envoyer des alertes critiques d&apos;Assisted Plantations
                sur WhatsApp.
              </Typography>
            </Alert>

            <Box>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  color: '#374151',
                  mb: 1.5,
                }}
              >
                Numéro malgache
              </Typography>
              <TextField
                fullWidth
                placeholder="34 12 345 67"
                value={phoneSuffix}
                onChange={handlePhoneChange}
                inputMode="numeric"
                InputProps={{
                  startAdornment: (
                    <InputAdornment
                      position="start"
                      sx={{
                        fontWeight: 600,
                        color: '#6b7280',
                        fontSize: '1rem',
                      }}
                    >
                      {COUNTRY_PREFIX}
                    </InputAdornment>
                  ),
                }}
                helperText="Saisissez les 9 chiffres de votre numéro malgache"
                FormHelperTextProps={{
                  sx: {
                    color: '#6b7280',
                    fontSize: '0.875rem',
                    mt: 1,
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontSize: '1rem',
                    '&:hover fieldset': {
                      borderColor: '#10b981',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#10b981',
                      borderWidth: 2,
                    },
                  },
                }}
              />
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 3,
            pt: 2,
            gap: 1.5,
          }}
        >
          <Button
            onClick={handleDefer}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              textTransform: 'none',
              fontWeight: 500,
              color: '#6b7280',
              '&:hover': {
                backgroundColor: '#f3f4f6',
              },
            }}
          >
            Retarder
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!isPhoneValid || saving}
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1,
              minWidth: 140,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.9375rem',
              backgroundColor: '#10b981',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              '&:hover': {
                backgroundColor: '#059669',
                boxShadow: '0 6px 16px rgba(16, 185, 129, 0.4)',
              },
              '&:disabled': {
                backgroundColor: '#d1d5db',
                color: '#9ca3af',
              },
            }}
          >
            {saving ? (
              <>
                <CircularProgress size={18} thickness={4} color="inherit" sx={{ mr: 1 }} />
                Enregistrement...
              </>
            ) : (
              'Confirmer'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <SnackbarAlert
        open={snackbarProps.snackbarOpen}
        message={snackbarProps.snackbarMessage}
        severity={snackbarProps.snackbarSeverity}
        onClose={snackbarProps.handleSnackbarClose}
      />
    </>
  )
}

