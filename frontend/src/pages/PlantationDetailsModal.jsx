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
  Paper,
  Stack,
} from '@mui/material'
import { Close, LocalFlorist, WaterDrop, LocationOn, Timeline, CalendarMonth } from '@mui/icons-material'
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

const formatDateLabel = (dateString) => {
  if (!dateString) return 'Date inconnue'
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const StatCard = ({ icon: Icon, label, value, accent }) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.5,
      borderRadius: 2,
      border: '1px solid #e5e7eb',
      background: 'linear-gradient(135deg, #ffffff, #f9fafb)',
      minHeight: 72,
    }}
  >
    <Box display="flex" alignItems="center" gap={1}>
      {Icon && <Icon sx={{ color: accent ?? '#10b981' }} />}
      <Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 600 }}>
          {label}
        </Typography>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 0.25 }}>
          {value}
        </Typography>
      </Box>
    </Box>
  </Paper>
)

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

  const handleConfirmPlanting = async () => {
    if (!plantation?.id) return
    setActionLoading(true)
    setActionError('')
    try {
      await api.post(`/plantations/${plantation.id}/confirm-planting`, {}, {
        headers: { Accept: 'application/ld+json' }
      })
      // On laisse le parent recharger la liste via onClose() + éventuel rafraîchissement
      onClose?.()
    } catch (e) {
      setActionError("Impossible de confirmer la plantation.")
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
  const startDate = plantation.datePlantation
  const daysUntilPlanting = startDate ? daysUntil(startDate) : null
  const isUpcomingPlantation = daysUntilPlanting !== null && daysUntilPlanting > 0
  const isPlantationConfirmed = plantation.datePlantationConfirmee !== null && plantation.datePlantationConfirmee !== undefined
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const plantingDate = startDate ? new Date(startDate) : null
  if (plantingDate) {
    plantingDate.setHours(0, 0, 0, 0)
  }
  const canConfirmPlanting = !isPlantationConfirmed && plantingDate && plantingDate <= today
  const rawSnapshots = Array.isArray(plantation.suiviSnapshots) ? plantation.suiviSnapshots : []
  const snapshot = isUpcomingPlantation ? null : rawSnapshots[0]
  const historicalSnapshots = isUpcomingPlantation ? [] : rawSnapshots.slice(1)
  const progression = snapshot ? parseFloat(snapshot.progressionPourcentage) : 0
  const statusColor = getStatusColor(plantation.etatActuel)
  const startDateLabel = startDate
    ? new Date(startDate).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : null
  const d = snapshot ? daysUntil(snapshot.arrosageRecoDate) : null

  const stage = snapshot?.stadeActuel
  const meteoToday = snapshot?.meteoDataJson?.daily?.[0]
  const lastSnapshotDateLabel = snapshot?.dateSnapshot
    ? new Date(snapshot.dateSnapshot).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })
    : null

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

        {/* Plantation à venir */}
        {isUpcomingPlantation && (
          <Box mb={2} display="flex" alignItems="flex-start" gap={1.5}>
            <CalendarMonth sx={{ color: '#10b981', mt: '2px' }} />
            <Box>
              <Typography variant={isXs ? 'body2' : 'body1'} sx={{ fontWeight: 600 }}>
                {daysUntilPlanting === 1
                  ? 'Plantation prévue dans 1 jour'
                  : `Plantation prévue dans ${daysUntilPlanting} jours`}
              </Typography>
              {startDateLabel && (
                <Typography variant="body2" color="text.secondary">
                  {`Date planifiée : ${startDateLabel}`}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Préparez le matériel et vos conditions de culture avant cette date.
              </Typography>
            </Box>
          </Box>
        )}

        {/* Aperçu rapide */}
        {!isUpcomingPlantation && snapshot && (
          <Stack direction="column" gap={1.5} mb={2}>
            <Box>
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
            <Box
              display="grid"
              gridTemplateColumns={isXs ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))'}
              gap={1}
            >
              <StatCard
                icon={WaterDrop}
                label="Prochain arrosage"
                value={
                  d === 0
                    ? `Aujourd'hui · ${snapshot.arrosageRecoQuantiteMl ?? '?'} ml`
                    : d === 1
                      ? `Dans 1 jour · ${snapshot.arrosageRecoQuantiteMl ?? '?'} ml`
                      : `Dans ${d ?? '?'} jours · ${snapshot.arrosageRecoQuantiteMl ?? '?'} ml`
                }
              />
              <StatCard
                icon={Timeline}
                label="Date recommandée"
                value={
                  snapshot.arrosageRecoDate
                    ? new Date(snapshot.arrosageRecoDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })
                    : 'À confirmer'
                }
              />
              <StatCard
                icon={LocalFlorist}
                label="Stade actuel"
                value={`${stage || 'Stade'} · ${Math.round(progression)}%`}
                accent="#f59e0b"
              />
            </Box>
          </Stack>
        )}

        {/* Meteo Today */}
        {!isUpcomingPlantation && meteoToday && (
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

        {!isUpcomingPlantation && snapshot && (
          <Box
            mb={2}
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid #e0f2fe',
              background: 'linear-gradient(145deg, #ecfccb, #d1fae5)',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Suivi actuel
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {lastSnapshotDateLabel ? `Relevé le ${lastSnapshotDateLabel}` : 'Relevé récent'} · {stage || 'Stade'} · {Math.round(progression)}% de progression
            </Typography>
            <Box
              display="grid"
              gridTemplateColumns={isXs ? '1fr' : 'repeat(2, minmax(0, 1fr))'}
              gap={1}
              mt={1.5}
            >
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, borderColor: '#bbf7d0', backgroundColor: 'rgba(255,255,255,0.65)' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Plantation
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {startDateLabel ? `Plantée le ${startDateLabel}` : 'Date inconnue'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Type : {template?.type ?? '—'}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, borderColor: '#bbf7d0', backgroundColor: 'rgba(255,255,255,0.65)' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Localisation
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {plantation.localisation ?? '—'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Confirmée : {canConfirmPlanting ? 'En attente' : isPlantationConfirmed ? 'Oui' : 'Non'}
                </Typography>
              </Paper>
            </Box>
          </Box>
        )}

        {!isUpcomingPlantation && (
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Timeline sx={{ color: '#6b7280' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Historique des suivis</Typography>
            </Box>
            {historicalSnapshots.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Aucune donnée historique pour le moment.</Typography>
            ) : (
              <Box display="flex" flexDirection="column" gap={1.5}>
                {historicalSnapshots.map((s, idx) => {
                  const progressionValue = Math.round(parseFloat(s.progressionPourcentage || '0'))
                  const decisionEntries = s.decisionDetailsJson && typeof s.decisionDetailsJson === 'object'
                    ? Object.entries(s.decisionDetailsJson)
                    : []
                  return (
                    <Paper
                    key={`${s.dateSnapshot}-${idx}`}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      borderColor: '#e5e7eb',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                    }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatDateLabel(s.dateSnapshot)}
                      </Typography>
                      <Chip
                        label={`${s.stadeActuel || 'Stade'} · ${progressionValue}%`}
                        sx={{ fontWeight: 600, borderRadius: 1.5 }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Prochain arrosage : {s.arrosageRecoDate ? formatDateLabel(s.arrosageRecoDate) : 'à définir'} · Quantité : {s.arrosageRecoQuantiteMl ?? '—'} ml
                    </Typography>
                    {decisionEntries.length > 0 && (
                      <Box
                        sx={{
                          bgcolor: '#f9fafb',
                          borderRadius: 1.5,
                          p: 1,
                          border: '1px dashed #e5e7eb',
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          Détails de décision
                        </Typography>
                        <Stack spacing={0.5} mt={0.5}>
                          {decisionEntries.map(([key, value]) => (
                            <Typography key={key} variant="caption" color="text.secondary">
                              {`${key} : ${typeof value === 'object' ? JSON.stringify(value) : value ?? '—'}`}
                            </Typography>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Paper>
                  )
                })}
              </Box>
            )}
          </Box>
        )}
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
        {canConfirmPlanting ? (
          <Button
            onClick={handleConfirmPlanting}
            variant="contained"
            disabled={actionLoading}
            sx={{ backgroundColor: '#10b981', ':hover': { backgroundColor: '#059669' } }}
          >
            {actionLoading ? '...' : "J'ai planté"}
          </Button>
        ) : (
          <Button
            onClick={handleWater}
            variant="contained"
            disabled={actionLoading || isUpcomingPlantation}
            sx={{ backgroundColor: '#10b981', ':hover': { backgroundColor: '#059669' } }}
          >
            {isUpcomingPlantation ? 'Disponible après plantation' : actionLoading ? '...' : "J'ai arrosé"}
          </Button>
        )}
      </Box>
    </Dialog>
  )
}


