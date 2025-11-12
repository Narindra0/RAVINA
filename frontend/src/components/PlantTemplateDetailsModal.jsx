import React from 'react'
import PropTypes from 'prop-types'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  Chip,
  Grid,
  Divider,
  Stack,
  Button,
  Skeleton,
  useMediaQuery,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import WaterDropIcon from '@mui/icons-material/WaterDrop'
import WbSunnyIcon from '@mui/icons-material/WbSunny'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import { styled, useTheme } from '@mui/material/styles'

const HeroImage = styled('div')(({ src }) => ({
  position: 'relative',
  width: '100%',
  paddingTop: '60%',
  borderRadius: 20,
  overflow: 'hidden',
  backgroundColor: '#f5f5f5',
  backgroundImage: src ? `url(${src})` : 'none',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  boxShadow: '0 18px 45px rgba(15, 118, 110, 0.25)',
  transition: 'transform 0.4s ease',
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.35) 100%)',
    opacity: src ? 1 : 0,
    transition: 'opacity 0.3s ease',
  },
  '&:hover': {
    transform: 'scale(1.01)',
  },
}))

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginBottom: theme.spacing(1),
  textTransform: 'uppercase',
  letterSpacing: 1,
  color: theme.palette.grey[600],
}))

const InfoCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: 16,
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, rgba(45, 55, 72, 0.9), rgba(26, 32, 44, 0.65))'
      : 'linear-gradient(135deg, rgba(236, 253, 245, 0.9), rgba(209, 250, 229, 0.7))',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(72, 187, 120, 0.25)' : 'rgba(16, 185, 129, 0.4)'}`,
  boxShadow: '0 15px 35px rgba(16, 185, 129, 0.12)',
}))

const DetailItem = ({ icon, label, value, secondary }) => (
  <InfoCard>
    <Stack direction="row" spacing={1} alignItems="center">
      {icon}
      <Typography fontWeight={600}>{label}</Typography>
    </Stack>
    <Typography variant="body2" mt={1.5}>
      {value || 'Non renseigné'}
    </Typography>
    {secondary ? (
      <Typography variant="body2" mt={0.5} color="text.secondary">
        {secondary}
      </Typography>
    ) : null}
  </InfoCard>
)

DetailItem.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  secondary: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
}

DetailItem.defaultProps = {
  value: null,
  secondary: null,
}

const resolveImageSrc = (imageSlug) => {
  if (!imageSlug) return '/images/plantes/default.jpg'
  if (typeof imageSlug === 'string' && imageSlug.startsWith('http')) return imageSlug
  return `/images/plantes/${imageSlug}`
}

export default function PlantTemplateDetailsModal({
  open,
  onClose,
  plant,
  loading,
  onPlanter,
}) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const heroSrc = plant ? resolveImageSrc(plant.imageSlug) : '/images/plantes/default.jpg'

  const handlePlanter = () => {
    if (onPlanter && plant?.id) {
      onPlanter(plant.id)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 5,
          minHeight: fullScreen ? '100%' : 'auto',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, #0f172a 0%, #111827 100%)'
            : 'linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)',
          display: 'flex',
          flexDirection: 'column',
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
          flexGrow: 1,
          background: 'transparent',
          p: { xs: 2, sm: 3.5, md: 4.5 },
        }}
      >
        {loading ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={5}>
              <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3 }} />
            </Grid>
            <Grid item xs={12} md={7}>
              <Skeleton height={32} width="60%" />
              <Skeleton height={24} width="80%" sx={{ mt: 1 }} />
              <Skeleton height={24} width="70%" sx={{ mt: 1 }} />
              <Skeleton variant="rounded" height={140} sx={{ mt: 3, borderRadius: 3 }} />
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={4} alignItems="stretch">
            <Grid item xs={12} md={5}>
              <Box sx={{ position: 'relative' }}>
                <HeroImage src={heroSrc} />
                <Stack
                  direction="row"
                  spacing={1}
                  flexWrap="wrap"
                  sx={{
                    position: 'absolute',
                    left: 12,
                    bottom: 12,
                    zIndex: 2,
                  }}
                >
                  <Chip
                    icon={<CalendarMonthIcon />}
                    label={plant?.bestSeason || 'Saison inconnue'}
                    color="success"
                    sx={{ bgcolor: 'rgba(16, 185, 129, 0.2)', color: '#064e3b' }}
                  />
                  <Chip
                    icon={<WbSunnyIcon />}
                    label={plant?.sunExposure || 'Exposition ?'}
                    sx={{ bgcolor: 'rgba(251, 191, 36, 0.25)', color: '#92400e' }}
                  />
                  {plant?.type ? (
                    <Chip
                      label={plant.type}
                      sx={{ bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#1d4ed8' }}
                    />
                  ) : null}
                </Stack>
              </Box>
            </Grid>
            <Grid item xs={12} md={7}>
              <Stack spacing={3}>
                <Box>
                  <SectionTitle variant="subtitle2">
                    Aperçu
                  </SectionTitle>
                  <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                    {plant?.description?.trim() ||
                      plant?.notes?.trim() ||
                      "Cette plante n'a pas encore de description. Ajoutez vos conseils d'entretien, vos astuces ou les conditions idéales pour la cultiver."}
                  </Typography>
                  {plant?.location ? (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1.5 }}
                    >
                      <strong>Emplacement conseillé :</strong> {plant.location}
                    </Typography>
                  ) : null}
                </Box>

                <Divider flexItem sx={{ opacity: 0.4 }} />

                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <DetailItem
                      icon={<WaterDropIcon color="success" />}
                      label="Arrosage recommandé"
                      value={plant?.wateringFrequency}
                      secondary={
                        plant?.wateringQuantityMl
                          ? `${plant.wateringQuantityMl} ml par arrosage`
                          : null
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DetailItem
                      icon={<CalendarMonthIcon color="warning" />}
                      label="Durée de culture"
                      value={
                        plant?.expectedHarvestDays
                          ? `${plant.expectedHarvestDays} jours avant récolte`
                          : null
                      }
                    />
                  </Grid>
                </Grid>

                {plant?.notes ? (
                  <Box
                    sx={{
                      borderRadius: 3,
                      p: 2.5,
                      border: '1px dashed rgba(107,114,128,0.25)',
                      backgroundColor:
                        theme.palette.mode === 'dark'
                          ? 'rgba(148, 163, 184, 0.08)'
                          : 'rgba(226, 232, 240, 0.35)',
                    }}
                  >
                    <SectionTitle variant="subtitle2">
                      Notes personnelles
                    </SectionTitle>
                    <Typography variant="body1">{plant.notes}</Typography>
                  </Box>
                ) : null}
              </Stack>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          px: { xs: 2, sm: 3.5, md: 4.5 },
          py: { xs: 2, sm: 3 },
          gap: 2,
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
          background: 'transparent',
        }}
      >
        <Button variant="text" onClick={onClose} sx={{ fontWeight: 600 }}>
          Fermer
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handlePlanter}
          disabled={!plant?.id || loading}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            px: 3,
            boxShadow: '0 12px 30px rgba(16, 185, 129, 0.3)',
          }}
        >
          Planter cette plante
        </Button>
      </DialogActions>
    </Dialog>
  )
}

PlantTemplateDetailsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  plant: PropTypes.object,
  loading: PropTypes.bool,
  onPlanter: PropTypes.func,
}

PlantTemplateDetailsModal.defaultProps = {
  plant: null,
  loading: false,
  onPlanter: undefined,
}

