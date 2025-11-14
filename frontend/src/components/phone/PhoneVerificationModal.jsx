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

import { api } from '../../lib/axios'
import { useSnackbar } from '../../hooks/useSnackbar'
import { SnackbarAlert } from '../ui/SnackbarAlert'

const COUNTRY_PREFIX = '+261'
const CODE_LENGTH = 6
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
  const [step, setStep] = useState('collect')
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [helperMessage, setHelperMessage] = useState('')

  const { showSnackbar, ...snackbarProps } = useSnackbar()

  const isPhoneValid = useMemo(() => sanitizeDigits(phoneSuffix).length === SUFFIX_LENGTH, [phoneSuffix])
  const isCodeComplete = useMemo(() => code.length === CODE_LENGTH, [code])

  const resetState = () => {
    setStep('collect')
    setCode('')
    setHelperMessage('')
  }

  useEffect(() => {
    if (!open) {
      resetState()
      setPhoneSuffix('')
      return
    }
    setPhoneSuffix(extractSuffix(defaultPhoneNumber))
    resetState()
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

  const handleCodeChange = (event) => {
    const digits = sanitizeDigits(event.target.value).slice(0, CODE_LENGTH)
    setCode(digits)
  }

  const handleSendCode = async () => {
    if (!isPhoneValid) {
      return
    }

    setSending(true)
    setHelperMessage('')

    try {
      const response = await api.post('/phone/send-code', {
        phoneSuffix: sanitizeDigits(phoneSuffix),
      })

      setStep('confirm')
      setHelperMessage("Nous venons d'envoyer un code à six chiffres sur votre WhatsApp.")
      showSnackbar('📨 Code envoyé via WhatsApp.', 'success')
      onStatusRefresh?.(response.data)
    } catch (error) {
      const message = error.response?.data?.error || "Impossible d'envoyer le code pour le moment."
      showSnackbar(message, 'error')
    } finally {
      setSending(false)
    }
  }

  const handleConfirmCode = async () => {
    if (!isCodeComplete) {
      return
    }

    setConfirming(true)

    try {
      await api.post('/phone/confirm-code', { code })
      showSnackbar('✅ Numéro confirmé. Merci !', 'success')
      onStatusRefresh?.()
      onVerified?.()
      resetState()
    } catch (error) {
      const message = error.response?.data?.error || 'Code invalide. Merci de réessayer.'
      showSnackbar(message, 'error')
    } finally {
      setConfirming(false)
    }
  }

  const handleDefer = () => {
    resetState()
    onDefer?.()
  }

  const handleEditNumber = () => {
    if (step !== 'confirm') {
      return
    }
    setStep('collect')
    setCode('')
    setHelperMessage('')
  }

  const primaryActionDisabled =
    (step === 'collect' && (!isPhoneValid || sending)) ||
    (step === 'confirm' && (!isCodeComplete || confirming))

  const primaryLabel = step === 'collect' ? 'Envoyer le code' : 'Confirmer'

  return (
    <>
      <Dialog
        open={open}
        onClose={handleDialogClose}
        fullWidth
        maxWidth="sm"
        aria-labelledby="phone-verification-title"
        disableRestoreFocus
      >
        <DialogTitle id="phone-verification-title">
          Vous n&apos;avez pas encore ajouté de numéro de téléphone.
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2}>
            <Alert severity="info">
              Cette étape garantit que nous pouvons vous envoyer des alertes critiques d&apos;Assisted Plantations sur
              WhatsApp.
            </Alert>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Numéro malgache (préfixe fixe {COUNTRY_PREFIX})
              </Typography>
              <TextField
                fullWidth
                placeholder="34 12 345 67"
                value={phoneSuffix}
                onChange={handlePhoneChange}
                onClick={step === 'confirm' ? handleEditNumber : undefined}
                inputMode="numeric"
                InputProps={{
                  startAdornment: <InputAdornment position="start">{COUNTRY_PREFIX}</InputAdornment>,
                  readOnly: step === 'confirm',
                }}
                helperText={
                  step === 'confirm'
                    ? 'Cliquez sur le champ pour corriger le numéro.'
                    : 'Saisissez les 9 chiffres restants.'
                }
                FormHelperTextProps={{ sx: { color: 'text.secondary' } }}
                sx={{
                  '& .MuiInputBase-root': {
                    backgroundColor: step === 'confirm' ? 'action.disabledBackground' : 'transparent',
                  },
                }}
              />
            </Box>

            {step === 'confirm' && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Code reçu sur WhatsApp
                </Typography>
                <TextField
                  fullWidth
                  placeholder="000000"
                  value={code}
                  onChange={handleCodeChange}
                  inputMode="numeric"
                  inputProps={{ maxLength: CODE_LENGTH }}
                  helperText="À saisir dès réception du message WhatsApp (6 chiffres)."
                />
              </Box>
            )}

            {helperMessage && (
              <Typography variant="body2" color="text.secondary">
                {helperMessage}
              </Typography>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDefer} color="inherit">
            Retarder
          </Button>
          <Button
            variant="contained"
            onClick={step === 'collect' ? handleSendCode : handleConfirmCode}
            disabled={primaryActionDisabled}
            sx={{ minWidth: 160 }}
          >
            {(sending || confirming) && (
              <CircularProgress size={18} thickness={4} color="inherit" sx={{ mr: 1 }} />
            )}
            {primaryLabel}
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

