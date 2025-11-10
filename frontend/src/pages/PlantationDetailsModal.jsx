import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Chip,
  Divider,
  Button,
  Alert,
} from '@mui/material'
import { Close, LocalFlorist, WaterDrop, LocationOn, Timeline } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { api } from '../lib/axios'

const getStatusColor = (status) => {
  const statusMap = {
    'ACTIVE': '#10b981',
    'HARVESTED': '#f59e0b',
    'ARCHIVED': '#6b7280',
    'PAUSED': '#ef4444',
  }
  return statusMap[status] || '#10b981'
}

const daysUntil = (dateString) => {
  if (!dateString) return null
  const target = new Date(dateString)
  const today = new Date()
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const t1 = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  const diffMs = t1 - t0
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
}

export default function PlantationDetailsModal({ open, onClose, plantation }) {
  const [actionLoading, setActionLoading] = React.useState(false)
  const [actionError, setActionError] = React.useState('')

  const handleWater = async () => {
    if (!plantation?.id) return
    setActionLoading(true)
    setActionError('')
    try {
      await api.post(`/plantations/${plantation.id}/water`, {}, {
        headers: { Accept: 'application/ld+json' }
      })
      // On laisse le parent recharger la liste via onClose() + éventuel rafraîchissement
      onClose?.()
    } catch (e) {
      setActionError("Impossible d'enregistrer l'arrosage.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!plantation?.id) return
    if (!confirm('Supprimer cette plantation ? Cette action est irréversible.')) return
    setActionLoading(true)
    setActionError('')
    try {
      await api.delete(`/plantations/${plantation.id}`, {
        headers: { Accept: 'application/ld+json' }
      })
      onClose?.({ deletedId: plantation.id })
    } catch (e) {
      setActionError('Suppression impossible.')
    } finally {
      setActionLoading(false)
    }
  }
  const theme = useTheme()
  const isXs = useMediaQuery(theme.breakpoints.down('sm'))

  if (!plantation) return null
  const template = plantation.plantTemplate || {}
  const snapshot = plantation.suiviSnapshots?.[0]
  const progression = snapshot ? parseFloat(snapshot.progressionPourcentage) : 0
  const statusColor = getStatusColor(plantation.etatActuel)
  const d = snapshot ? daysUntil(snapshot.arrosageRecoDate) : null

  const stage = snapshot?.stadeActuel
  const meteoToday = snapshot?.meteoDataJson?.daily?.[0]
  const lastSnapshots = (plantation.suiviSnapshots || []).slice(0, 3)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={isXs}
      PaperProps={{
        sx: { borderRadius: isXs ? 0 : 3 }
      }}
    >
      <DialogTitle sx={{ pr: 7, py: isXs ? 1.5 : 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={1.5} flexWrap="wrap">
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" minWidth={0}>
            <LocalFlorist sx={{ color: statusColor }} />
            <Typography variant={isXs ? 'subtitle1' : 'h6'} sx={{ fontWeight: 700 }}>
              {template?.name || 'Plantation'}{template?.type ? ` (${template.type})` : ''}
            </Typography>
          </Box>
          <Chip
            label={plantation.etatActuel}
            sx={{
              bgcolor: statusColor,
              color: 'white',
              fontWeight: 700,
              height: isXs ? 26 : 28,
              fontSize: isXs ? '0.75rem' : '0.8rem'
            }}
          />
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          pt: isXs ? 1 : 2,
          maxHeight: isXs ? '100vh' : '70vh',
          overflowY: 'auto'
        }}
      >
        {actionError && (
          <Alert severity="error" sx={{ mb: 1 }}>{actionError}</Alert>
        )}
        {/* Localisation */}
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <LocationOn sx={{ color: '#ef4444' }} />
          <Typography variant="body2" color="text.secondary">
            {plantation.localisation}
          </Typography>
        </Box>

        {/* Progression */}
        {snapshot && (
          <Box mb={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{stage || 'Stade'}</Typography>
              <Typography variant="subtitle2" color="text.secondary">{Math.round(progression)}%</Typography>
            </Box>
            <Box sx={{ width: '100%', height: 10, bgcolor: '#e5e7eb', borderRadius: 9999 }}>
              <Box
                sx={{
                  width: `${Math.min(100, Math.max(0, progression))}%`,
                  height: '100%',
                  bgcolor: '#10b981',
                  borderRadius: 9999,
                }}
              />
            </Box>
          </Box>
        )}

        {/* Arrosage */}
        {snapshot && (
          <Box display="flex" alignItems="flex-start" gap={1.5} mb={2}>
            <WaterDrop sx={{ color: '#10b981', mt: '2px' }} />
            <Box>
              <Typography variant={isXs ? 'body2' : 'body1'} sx={{ fontWeight: 600 }}>
                {d === 0
                  ? `Prochain arrosage aujourd'hui avec ${snapshot.arrosageRecoQuantiteMl ?? ''} ml`
                  : d === 1
                    ? `Prochain arrosage dans 1 jour avec ${snapshot.arrosageRecoQuantiteMl ?? ''} ml`
                    : `Prochain arrosage dans ${d ?? '?'} jours avec ${snapshot.arrosageRecoQuantiteMl ?? ''} ml`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {snapshot.arrosageRecoDate
                  ? new Date(snapshot.arrosageRecoDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })
                  : 'Date inconnue'}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Meteo Today */}
        {meteoToday && (
          <Box mb={2} display="flex" gap={1} alignItems="center" flexWrap="wrap">
            <Chip
              icon={<Timeline />}
              label={`Pluie: ${meteoToday.precipitation_sum ?? 0} mm`}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            />
            <Chip
              label={`Max: ${meteoToday.temperature_max ?? '-'}°C`}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            />
            <Chip
              label={`Min: ${meteoToday.temperature_min ?? '-'}°C`}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            />
          </Box>
        )}

        <Divider sx={{ my: 1.5 }} />

        {/* Historique récent */}
        <Box>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Timeline sx={{ color: '#6b7280' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Derniers suivis</Typography>
          </Box>
          {lastSnapshots.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Aucun snapshot récent.</Typography>
          ) : (
            <Box display="flex" flexDirection="column" gap={1}>
              {lastSnapshots.map((s, idx) => (
                <Box key={idx} display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    {new Date(s.dateSnapshot).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {s.stadeActuel} · {Math.round(parseFloat(s.progressionPourcentage || '0'))}%
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </DialogContent>

      <Box display="flex" justifyContent="space-between" alignItems="center" px={2} py={1.5}>
        <Button
          onClick={handleDelete}
          color="error"
          variant="outlined"
          disabled={actionLoading}
        >
          Supprimer
        </Button>
        <Button
          onClick={handleWater}
          variant="contained"
          disabled={actionLoading}
          sx={{ backgroundColor: '#10b981', ':hover': { backgroundColor: '#059669' } }}
        >
          {actionLoading ? '...' : "J'ai arrosé"}
        </Button>
      </Box>
    </Dialog>
  )
}


