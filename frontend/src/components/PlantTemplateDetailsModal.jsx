import React from 'react'
import PropTypes from 'prop-types'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Chip,
  Grid,
  Divider,
  Stack,
  useMediaQuery,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import WaterDropIcon from '@mui/icons-material/WaterDrop'
import WbSunnyIcon from '@mui/icons-material/WbSunny'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import NoteIcon from '@mui/icons-material/Note'
import { styled, useTheme } from '@mui/material/styles'

const HeroImage = styled('div')(({ src }) => ({
  position: 'relative',
  width: '100%',
  paddingTop: '56%',
  borderRadius: 16,
  overflow: 'hidden',
  backgroundColor: '#f5f5f5',
  backgroundImage: src ? `url(${src})` : 'none',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
}))

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginBottom: theme.spacing(1),
  textTransform: 'uppercase',
  letterSpacing: 1,
  color: theme.palette.grey[600],
}))

export default function PlantTemplateDetailsModal({
  open,
  onClose,
  plant,
  loading,
}) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 4,
          minHeight: fullScreen ? '100%' : 'auto',
          background: theme.palette.background.default,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pr: 1,
        }}
      >
        <Typography variant="h5" fontWeight={700}>
          {plant?.name || (loading ? 'Chargement…' : 'Modèle de plante')}
        </Typography>
        <IconButton onClick={onClose} edge="end" size="large">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
          p: { xs: 2, sm: 3, md: 4 },
        }}
      >
        {loading ? (
          <Typography>Chargement des informations…</Typography>
        ) : (
          <Grid container spacing={4}>
            <Grid item xs={12} md={5}>
              <HeroImage src={plant?.imageSlug} />
              <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
                <Chip
                  icon={<CalendarMonthIcon />}
                  label={plant?.bestSeason || 'Saison inconnue'}
                  color="success"
                  variant="outlined"
                />
                <Chip
                  icon={<WbSunnyIcon />}
                  label={plant?.sunExposure || 'Exposition ?'}
                  variant="outlined"
                />
                {plant?.type && (
                  <Chip label={plant.type} variant="outlined" color="primary" />
                )}
              </Stack>
            </Grid>
            <Grid item xs={12} md={7}>
              <Box
                sx={{
                  display: 'grid',
                  gap: 3,
                }}
              >
                <Box>
                  <SectionTitle variant="subtitle2">
                    Informations principales
                  </SectionTitle>
                  <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                    {plant?.description ||
                      "Cette plante n'a pas encore de description détaillée. Ajoutez des notes pour partager vos conseils d'entretien, la période idéale pour la planter ou des astuces de culture."}
                  </Typography>
                </Box>
                <Divider />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        bgcolor: 'rgba(76, 175, 80, 0.08)',
                        border: '1px solid rgba(76, 175, 80, 0.25)',
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <WaterDropIcon color="success" />
                        <Typography fontWeight={600}>
                          Arrosage recommandé
                        </Typography>
                      </Stack>
                      <Typography variant="body2" mt={1.5}>
                        {plant?.wateringFrequency ||
                          'Fréquence non renseignée'}
                      </Typography>
                      {plant?.wateringQuantityMl && (
                        <Typography variant="body2" mt={0.5} color="text.secondary">
                          {plant.wateringQuantityMl} ml par arrosage
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        bgcolor: 'rgba(255, 167, 38, 0.08)',
                        border: '1px solid rgba(255, 167, 38, 0.3)',
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CalendarMonthIcon color="warning" />
                        <Typography fontWeight={600}>
                          Durée de culture
                        </Typography>
                      </Stack>
                      <Typography variant="body2" mt={1.5}>
                        {plant?.expectedHarvestDays
                          ? `${plant.expectedHarvestDays} jours avant récolte`
                          : 'Durée non renseignée'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                {plant?.cyclePhasesJson?.length ? (
                  <Box>
                    <SectionTitle variant="subtitle2">
                      Phases de croissance
                    </SectionTitle>
                    <Stack spacing={1.5}>
                      {plant.cyclePhasesJson.map((phase, index) => (
                        <Box
                          key={`${phase?.label || 'phase'}-${index}`}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            border: '1px dashed rgba(0,0,0,0.12)',
                            bgcolor: 'background.paper',
                          }}
                        >
                          <Typography fontWeight={600}>
                            {phase?.label || `Étape ${index + 1}`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {phase?.description ||
                              'Ajoutez une description détaillée pour cette étape.'}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                ) : null}
                {plant?.notes && (
                  <Box>
                    <SectionTitle variant="subtitle2">
                      Notes personnelles
                    </SectionTitle>
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <NoteIcon color="action" />
                      <Typography variant="body1">{plant.notes}</Typography>
                    </Stack>
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        )}
      </DialogContent>
    </Dialog>
  )
}

PlantTemplateDetailsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  plant: PropTypes.object,
  loading: PropTypes.bool,
}

PlantTemplateDetailsModal.defaultProps = {
  plant: null,
  loading: false,
}

