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
import { Close, LocalFlorist, LocationOn, Timeline } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { api } from '../lib/axios'
import { getPlantingScheduleState } from '../utils/plantationSchedule'

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

const parseNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const normalizeDecisionDetails = (details) => {
  if (!details || typeof details !== 'object') {
    return {
      wateringNotes: [],
      frequencyDays: null,
      lifecycle: null,
      autoWateredByRain: false,
      thresholdsUsed: {},
    }
  }
  const rawNotes = Array.isArray(details.watering_notes)
    ? details.watering_notes.filter((note) => typeof note === 'string' && note.trim().length > 0)
    : []
  const wateringNotes = rawNotes
    .map((note) => {
      const cleaned = note.replace(/^•\s*/, '').trim()
      if (!cleaned) {
        return null
      }
      return cleaned.endsWith('.') ? cleaned : `${cleaned}.`
    })
    .filter(Boolean)

  return {
    wateringNotes,
    frequencyDays: parseNumber(details.frequency_days),
    lifecycle: typeof details.lifecycle === 'object' && details.lifecycle !== null
      ? details.lifecycle
      : null,
    autoWateredByRain: Boolean(details.auto_watered_by_rain),
    thresholdsUsed: typeof details.thresholds_used === 'object' && details.thresholds_used !== null
      ? details.thresholds_used
      : {},
  }
}

const formatLiters = (value) => {
  const parsed = parseNumber(value)
  if (parsed === null) return null
  const liters = parsed / 1000
  if (!Number.isFinite(liters)) return null
  return liters >= 1 ? liters.toFixed(1) : liters.toFixed(2)
}

const isOutdoorLocation = (plantation) => {
  if (!plantation) return false
  const rawLocation = plantation.localisation ? plantation.localisation.toLowerCase() : ''
  const outdoorKeywords = ['balcon', 'terrasse', 'jardin', 'extérieur', 'exterieur', 'patio', 'cour']
  if (outdoorKeywords.some((word) => rawLocation.includes(word))) {
    return true
  }
  const templateLocation = typeof plantation.plantTemplate?.location === 'string'
    ? plantation.plantTemplate.location.toLowerCase()
    : ''
  return ['exterieur', 'extérieur', 'plein air'].some((word) => templateLocation.includes(word))
}

export default function PlantationDetailsModal({ open, onClose, plantation }) {
  const [actionLoading, setActionLoading] = React.useState(false)
  const [actionError, setActionError] = React.useState('')
  const [showHistory, setShowHistory] = React.useState(false)

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

  React.useEffect(() => {
    setShowHistory(false)
  }, [plantation?.id])

  if (!plantation) return null
  const template = plantation.plantTemplate || {}
  const startDate = plantation.datePlantation
  const isPlantationConfirmed = plantation.datePlantationConfirmee !== null && plantation.datePlantationConfirmee !== undefined
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const plantingDate = startDate ? new Date(startDate) : null
  if (plantingDate) {
    plantingDate.setHours(0, 0, 0, 0)
  }
  const canConfirmPlanting = !isPlantationConfirmed && plantingDate && plantingDate <= today
  const plantingSchedule = getPlantingScheduleState(plantation)
  const isAwaitingPlanting = ['waiting', 'today', 'overdue'].includes(plantingSchedule.type)
  const rawSnapshots = Array.isArray(plantation.suiviSnapshots) ? plantation.suiviSnapshots : []
  const snapshot = isPlantationConfirmed ? rawSnapshots[0] : null
  const historicalSnapshots = isPlantationConfirmed ? rawSnapshots.slice(1) : []
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
  const roundedProgression = Number.isFinite(progression) ? Math.round(progression) : 0

  const stage = snapshot?.stadeActuel
  const meteoToday = snapshot?.meteoDataJson?.daily?.[0]
  const currentDecisionDetails = normalizeDecisionDetails(snapshot?.decisionDetailsJson)
  const hasCurrentAdvice = currentDecisionDetails.wateringNotes.length > 0
  const isOutdoor = isOutdoorLocation(plantation)
  const lastSnapshotDateLabel = snapshot?.dateSnapshot
    ? new Date(snapshot.dateSnapshot).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })
    : null
  const wateringQuantityL = formatLiters(snapshot?.arrosageRecoQuantiteMl)
  const wateringQuantityLabel = wateringQuantityL !== null ? `${wateringQuantityL} L` : '—'
  const wateringDelayLabel = (() => {
    if (d === null || d === undefined) {
      return `À planifier - Quantité : ${wateringQuantityLabel}`
    }
    if (d === 0) {
      return `Aujourd'hui - Quantité : ${wateringQuantityLabel}`
    }
    if (d === 1) {
      return `Dans 1 jour - Quantité : ${wateringQuantityLabel}`
    }
    return `Dans ${d} jours - Quantité : ${wateringQuantityLabel}`
  })()
  const recommendedDateLabel = snapshot?.arrosageRecoDate ? formatDateLabel(snapshot.arrosageRecoDate) : 'À confirmer'
  const plantLabel = template?.type ?? template?.name ?? '—'
  const narrativeLine = snapshot
    ? `D'après le relevé du ${lastSnapshotDateLabel ?? 'jour en cours'}, la plante ${plantLabel}, plantée le ${startDateLabel ?? 'date inconnue'}, est au stade de ${stage ?? 'à préciser'} avec une progression de ${roundedProgression}%.`
    : ''
  const templateName = template?.name ?? 'cette plante'
  const plantingNotice = (() => {
    if (!isAwaitingPlanting) return null
    if (plantingSchedule.type === 'waiting') {
      return {
        severity: 'info',
        text: plantingSchedule.daysRemaining === 1
          ? 'Plantation prévue dans 1 jour.'
          : `Plantation prévue dans ${plantingSchedule.daysRemaining} jours.`,
      }
    }
    if (plantingSchedule.type === 'today') {
      return {
        severity: 'info',
        text: `Plantation prévue pour aujourd'hui.`,
      }
    }
    return {
      severity: 'warning',
      text: plantingSchedule.daysLate === 1
        ? `Plantation prévue hier. Nous recommandons de planter ${templateName} aujourd'hui.`
        : `Plantation prévue il y a ${plantingSchedule.daysLate} jours. Nous recommandons de planter ${templateName} dès que possible.`,
    }
  })()

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

        {plantingNotice && (
          <Alert
            severity={plantingNotice.severity}
            sx={{
              mb: 2,
              borderRadius: 2,
            }}
          >
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {plantingNotice.text}
            </Typography>
            {startDateLabel && (
              <Typography variant="body2" color="text.secondary">
                {`Date planifiée : ${startDateLabel}`}
              </Typography>
            )}
          </Alert>
        )}

        {isPlantationConfirmed && (
          <>
            {/* Aperçu rapide */}
            {snapshot && (
              <Stack direction="column" gap={1.5} mb={2}>
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{stage || 'Stade'}</Typography>
                    <Typography variant="subtitle2" color="text.secondary">{roundedProgression}%</Typography>
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
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#f8fafc',
                  }}
                >
                  <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, color: 'text.secondary' }}>
                    Date du prochain arrosage
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>
                    {wateringDelayLabel}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {`Date recommandée : ${recommendedDateLabel}`}
                  </Typography>
              {currentDecisionDetails.autoWateredByRain && (
                <Alert
                  severity="info"
                  variant="outlined"
                  sx={{
                    mt: 1.5,
                    borderRadius: 2,
                    borderColor: '#bfdbfe',
                    backgroundColor: '#eff6ff',
                    color: '#1e3a8a',
                  }}
                >
                  Arrosage reporté automatiquement en raison des fortes pluies prévues.
                </Alert>
              )}
                </Box>
              </Stack>
            )}

            {/* Conseils personnalisés */}
            {snapshot && hasCurrentAdvice && (
              <Box
                mb={2}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid #fcd34d',
                  background: 'linear-gradient(145deg, #fefce8, #fef3c7)',
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Détails Plantation
                </Typography>
                <Stack spacing={1} mt={1.25}>
                  {currentDecisionDetails.wateringNotes.map((note, idx) => (
                    <Typography key={`${note}-${idx}`} variant="body2" sx={{ color: '#78350f' }}>
                      {note}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            )}

        {/* Meteo Today */}
        {snapshot && isOutdoor && (
          meteoToday ? (
            <Box
              mb={2}
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid #dbeafe',
                background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Conditions météo actuelles
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Chip
                  icon={<Timeline />}
                  label={`Pluie : ${meteoToday.precipitation_sum ?? 0} mm`}
                  variant="outlined"
                  sx={{ borderRadius: 2, backgroundColor: 'white' }}
                />
                <Chip
                  label={`Max : ${meteoToday.temperature_max ?? '-'}°C`}
                  variant="outlined"
                  sx={{ borderRadius: 2, backgroundColor: 'white' }}
                />
                <Chip
                  label={`Min : ${meteoToday.temperature_min ?? '-'}°C`}
                  variant="outlined"
                  sx={{ borderRadius: 2, backgroundColor: 'white' }}
                />
              </Box>
            </Box>
          ) : (
            <Alert
              severity="info"
              variant="outlined"
              sx={{
                mb: 2,
                borderRadius: 2,
                borderColor: '#fde68a',
                backgroundColor: '#fffbeb',
                color: '#92400e',
              }}
            >
              Aucune donnée météo disponible pour aujourd’hui.
            </Alert>
          )
        )}

            <Divider sx={{ my: 1.5 }} />

            {snapshot && (
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
                  {narrativeLine}
                </Typography>
              </Box>
            )}

            {snapshot && (
              <Box>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Timeline sx={{ color: '#6b7280' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Historique de suivi</Typography>
                  </Box>
                  <Button
                    size="small"
                    onClick={() => setShowHistory((prev) => !prev)}
                  >
                    {showHistory ? 'Masquer' : 'Afficher'}
                  </Button>
                </Box>
                {!showHistory && (
                  <Typography variant="body2" color="text.secondary">
                    Historique masqué. Cliquez sur « Afficher » pour consulter les relevés précédents.
                  </Typography>
                )}
                {showHistory && (
                  historicalSnapshots.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Aucune donnée historique pour le moment.
                    </Typography>
                  ) : (
                    <Box display="flex" flexDirection="column" gap={1.25}>
                      {historicalSnapshots.map((s, idx) => {
                        const progressionValue = Math.round(parseFloat(s.progressionPourcentage || '0'))
                        const decisions = normalizeDecisionDetails(s.decisionDetailsJson)
                        const notesSummary = decisions.wateringNotes
                        const wasAutoWatered = decisions.autoWateredByRain
                        return (
                          <Paper
                            key={`${s.dateSnapshot}-${idx}`}
                            variant="outlined"
                            sx={{
                              p: 1.25,
                              borderRadius: 2,
                              borderColor: '#e5e7eb',
                              backgroundColor: '#ffffff',
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {formatDateLabel(s.dateSnapshot)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {`${s.stadeActuel || 'Stade'} · ${progressionValue}% de progression`}
                            </Typography>
                            {notesSummary.length > 0 && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {notesSummary.join(' ')}
                              </Typography>
                            )}
                            {wasAutoWatered && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                Arrosage reporté automatiquement en raison de la pluie.
                              </Typography>
                            )}
                          </Paper>
                        )
                      })}
                    </Box>
                  )
                )}
              </Box>
            )}
          </>
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
            disabled={actionLoading || isAwaitingPlanting}
            sx={{ backgroundColor: '#10b981', ':hover': { backgroundColor: '#059669' } }}
          >
            {isAwaitingPlanting ? 'Disponible après plantation' : actionLoading ? '...' : "J'ai arrosé"}
          </Button>
        )}
      </Box>
    </Dialog>
  )
}


