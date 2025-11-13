import React, { useEffect, useState, lazy, Suspense } from 'react'
import { authStore } from '../store/auth'
import { api } from '../lib/axios'
const AddPlantModal = lazy(() => import('./AddPlantModal'))
import Sidebar from './Sidebar'
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Box,
  Typography,
  IconButton, 
} from '@mui/material'
import {
  CalendarMonth,
  AddCircleOutline,
  ArrowForward,
  WbSunny,
  Schedule,
  // 🚀 Ajout de l'icône de menu
  Menu as MenuIcon,
  InfoOutlined,
} from '@mui/icons-material'

import { dashboardStyles, PRIMARY_GREEN, DARK_GREEN } from '../styles/Dashboard.styles'
const WeatherCard = lazy(() => import('./WeatherCard'))
const CreateUserPlantationModal = lazy(() => import('./CreateUserPlantationModal'))
const PlantTemplateDetailsModal = lazy(() => import('../components/PlantTemplateDetailsModal'))


const getPlantImagePath = (imageSlug) => {
  if (!imageSlug) {
    return '/images/plantes/default.jpg' 
  }
  if (typeof imageSlug === 'string' && imageSlug.startsWith('http')) {
    return imageSlug
  }
  return `/images/plantes/${imageSlug}`
}

const DEFAULT_PLANT_IMAGE = '/images/plantes/default.jpg'

// Fonction pour extraire le nom principal (sans le contenu entre parenthèses)
const getMainPlantName = (fullName) => {
  if (!fullName) return ''
  const match = fullName.match(/^([^(]+)/)
  return match ? match[1].trim() : fullName
}

const normalizePlantTemplate = (item) => {
  if (!item) return null

  const extractId = () => {
    if (item.id != null) return item.id
    const hydraId = item['@id']
    if (typeof hydraId === 'string') {
      const parts = hydraId.split('/')
      const last = parts.pop()
      const parsed = parseInt(last, 10)
      return Number.isNaN(parsed) ? null : parsed
    }
    return null
  }

  return {
    id: extractId(),
    name: item.name ?? '',
    type: item.type ?? '',
    bestSeason: item.bestSeason ?? '',
    imageSlug: item.imageSlug ?? null,
    sunExposure: item.sunExposure ?? '',
    wateringFrequency: item.wateringFrequency ?? '',
    wateringQuantityMl: item.wateringQuantityMl ?? null,
    expectedHarvestDays: item.expectedHarvestDays ?? null,
    notes: item.notes ?? '',
    location: item.location ?? '',
    description: item.description ?? item.notes ?? '',
    cyclePhasesJson: Array.isArray(item.cyclePhasesJson) ? item.cyclePhasesJson : [],
  }
}


export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [plants, setPlants] = useState([])
  const [showAllPlants, setShowAllPlants] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [suggestions, setSuggestions] = useState(null)
  const [loadingData, setLoadingData] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false) 
  const [showCreatePlantationModal, setShowCreatePlantationModal] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsPlant, setDetailsPlant] = useState(null)

  const handleAddPlant = (newPlant) => {
    setPlants([...plants, newPlant])
  }
  
  const toggleSidebarMobile = () => {
    setIsSidebarMobileOpen(!isSidebarMobileOpen)
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true)
      const [userRes, plantsRes, suggestionsRes] = await Promise.allSettled([
        api.get('/user'),
        api.get('/plant_templates', { params: { itemsPerPage: 5, page: 1 } }),
        api.get('/suggestions/plants'),
      ])

      if (userRes.status === 'fulfilled') {
        setUser(userRes.value.data)
      } else {
        console.error('Erreur lors du chargement du profil utilisateur', userRes.reason)
      }

      if (plantsRes.status === 'fulfilled') {
        const data = plantsRes.value.data
        const templateData = Array.isArray(data) ? data : (data['member'] || data['hydra:member'] || [])
        setPlants(templateData.map(normalizePlantTemplate))
      } else {
        console.error('Erreur lors du chargement des plantes', plantsRes.reason)
      }

      if (suggestionsRes.status === 'fulfilled') {
        setSuggestions(suggestionsRes.value.data)
      } else {
        console.error('Erreur lors du chargement des suggestions', suggestionsRes.reason)
      }

      setLoadingData(false)
    }
    fetchData()
  }, [])

  const handleViewAll = async () => {
    if (showAllPlants) return
    setLoadingMore(true)
    try {
      const res = await api.get('/plant_templates')
      const data = res.data
      const templateData = Array.isArray(data) ? data : (data['member'] || data['hydra:member'] || [])
      setPlants(templateData.map(normalizePlantTemplate))
      setShowAllPlants(true)
    } catch (err) {
      console.error('Erreur lors du chargement de toutes les plantes', err)
    } finally {
      setLoadingMore(false)
    }
  }

  const handleOpenCreatePlantation = (templateId) => {
    setSelectedTemplateId(templateId || null)
    setShowCreatePlantationModal(true)
  }

  const handleOpenDetails = async (templateId, fallbackPlant = null) => {
    if (!templateId && !fallbackPlant) return
    setIsDetailsModalOpen(true)
    setDetailsLoading(true)

    if (fallbackPlant) {
      setDetailsPlant(normalizePlantTemplate(fallbackPlant))
    }

    try {
      if (templateId) {
        const res = await api.get(`/plant_templates/${templateId}`)
        setDetailsPlant(normalizePlantTemplate(res.data))
      }
    } catch (err) {
      console.error('Erreur lors du chargement des détails de la plante', err)
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleCloseDetails = () => {
    setIsDetailsModalOpen(false)
    setDetailsPlant(null)
  }

  const handlePlanterFromDetails = (templateId) => {
    if (!templateId) return
    handleCloseDetails()
    setTimeout(() => {
      handleOpenCreatePlantation(templateId)
    }, 150)
  }

  if (!authStore.isAuthenticated()) {
    window.location.href = '/login'
    return null
  }

  return (
    <Box sx={dashboardStyles.root}>
      {/* 🚀 BOUTON DE MENU MOBILE : Affiché uniquement sur les petits écrans */}
      <Box
        sx={{
          display: { xs: 'block', md: 'none' }, // Visible uniquement sur mobile
          position: 'fixed',
          top: 10,
          left: 10,
          zIndex: 1200, 
        }}
      >
        <IconButton 
          color="primary" 
          aria-label="open drawer" 
          onClick={toggleSidebarMobile}
          sx={{ backgroundColor: 'white', boxShadow: 3 }} // Style pour que le bouton ressorte
        >
          <MenuIcon />
        </IconButton>
      </Box>

      {/* Sidebar */}
      {/* 🚀 MISE À JOUR : Passage des props de contrôle mobile à Sidebar */}
      <Sidebar 
        user={user} 
        isMobileOpen={isSidebarMobileOpen}
        onClose={toggleSidebarMobile} 
      />

      {/* Main Content */}
      <Box sx={dashboardStyles.mainContent}>
        {loadingData ? (
          <Box sx={dashboardStyles.loadingContainer}>
            <CircularProgress sx={{ color: '#10b981' }} size={50} />
          </Box>
        ) : (
          <Container maxWidth="xl" sx={dashboardStyles.container}>
            {/* Header */}
            <Box sx={dashboardStyles.headerSection}>
              <Typography variant="h3" sx={dashboardStyles.welcomeTitle}>
                Bienvenue sur Ravina,
              </Typography>
              <Typography variant="h6" sx={dashboardStyles.welcomeSubtitle}>
                Bonjour {user ? user.email.split('@')[0] : 'Narindra'},
              </Typography>
            </Box>

            {/* Feature Banner */}
            <Suspense fallback={null}>
              <WeatherCard />
            </Suspense>

            {/* Seasonal Suggestions */}
            <Box sx={dashboardStyles.sectionContainer}>
              <Box sx={dashboardStyles.sectionHeader}>
                <Box sx={dashboardStyles.sectionHeaderLeft}>
                  <CalendarMonth sx={dashboardStyles.sectionIcon} />
                  <Box>
                    <Typography variant="h5" sx={dashboardStyles.sectionTitle}>
                      Suggestions saisonnières
                    </Typography>
                    <Typography variant="body2" sx={dashboardStyles.sectionSubtitle}>
                      Saison : {suggestions?.currentSeason || 'Printemps'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {suggestions && suggestions.suggestions && suggestions.suggestions.length > 0 ? (
                <Grid container spacing={1.5}>
                  {suggestions.suggestions.map((plant) => (
                    <Grid item xs={12} sm={6} md={3} key={plant.id}>
                      <Card sx={dashboardStyles.plantCard}>
                        <Box sx={dashboardStyles.plantCardImage}>
                          <img
                            src={getPlantImagePath(plant.imageSlug)}
                            alt={plant.name}
                            loading="lazy"
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_PLANT_IMAGE; }}
                          />
                        </Box>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                            <Typography 
                              variant="h6" 
                              sx={{
                                ...dashboardStyles.plantCardTitle,
                                cursor: 'pointer',
                                color: '#111827',
                                '&:hover': {
                                  textDecoration: 'underline',
                                  color: '#374151',
                                },
                              }}
                              onClick={() => handleOpenDetails(plant.id, plant)}
                            >
                              {getMainPlantName(plant.name)}
                            </Typography>
                            <Box sx={dashboardStyles.plantCardBadge}>
                              {plant.type}
                            </Box>
                          </Box>
                        </CardContent>
                        <CardActions sx={dashboardStyles.cardActions}>
                          <Button
                            fullWidth
                            size="medium"
                            variant="contained"
                            startIcon={<AddCircleOutline />}
                            onClick={() => handleOpenCreatePlantation(plant.id)}
                            sx={{ 
                              textTransform: 'none', 
                              fontWeight: 700, 
                              backgroundColor: '#10b981', 
                              '&:hover': { backgroundColor: '#059669' } 
                            }}
                            aria-label={`Planter ${plant.name}`}
                          >
                            Planter
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={dashboardStyles.emptyState}>
                  <Typography>Aucune suggestion pour la saison actuelle.</Typography>
                </Box>
              )}
            </Box>

            {/* My Listings */}
            <Box sx={dashboardStyles.sectionContainer}>
              <Box sx={dashboardStyles.sectionHeader}>
                <Typography variant="h5" sx={dashboardStyles.sectionTitle}>
                  Inventaire & Collection
                </Typography>
                {!showAllPlants && plants.length >= 5 && (
                  <Button
                    endIcon={<ArrowForward />}
                    sx={dashboardStyles.viewAllButton}
                    onClick={handleViewAll}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Chargement…' : 'Voir toutes'}
                  </Button>
                )}
              </Box>

              {plants.length === 0 ? (
                <Box sx={dashboardStyles.emptyState}>
                  <Typography>Vous n'avez encore enregistré aucune plante.</Typography>
                </Box>
              ) : (
                <Grid container spacing={1.5}>
                  {(showAllPlants ? plants : plants.slice(0, 5)).map((plant) => (
                    <Grid item xs={12} sm={6} md={3} key={plant.id}>
                      <Card sx={dashboardStyles.plantCard}>
                        <Box sx={dashboardStyles.plantCardImage}>
                          <img
                            src={getPlantImagePath(plant.imageSlug)}
                            alt={plant.name}
                            loading="lazy"
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_PLANT_IMAGE; }}
                          />
                        </Box>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                            <Typography 
                              variant="h6" 
                              sx={{
                                ...dashboardStyles.plantCardTitle,
                                cursor: 'pointer',
                                color: '#111827',
                                '&:hover': {
                                  textDecoration: 'underline',
                                  color: '#374151',
                                },
                              }}
                              onClick={() => handleOpenDetails(plant.id, plant)}
                            >
                              {getMainPlantName(plant.name)}
                            </Typography>
                            <Box sx={dashboardStyles.plantCardBadge}>
                              {plant.type}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}

              <Box sx={dashboardStyles.addButtonContainer}>
                <Button
                  variant="contained"
                  startIcon={<AddCircleOutline />}
                  onClick={() => setShowAddModal(true)}
                  sx={dashboardStyles.addPlantButton}
                >
                  Ajouter une nouvelle plante
                </Button>
              </Box>
            </Box>
          </Container>
        )}
      </Box>

      {/* Modal */}
      <Suspense fallback={null}>
        <AddPlantModal 
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onPlantAdded={handleAddPlant}
        />
      </Suspense>

      {/* Create Plantation Modal */}
      <Suspense fallback={null}>
        <CreateUserPlantationModal
          open={showCreatePlantationModal}
          onClose={() => setShowCreatePlantationModal(false)}
          onCreated={() => setShowCreatePlantationModal(false)}
          initialTemplateId={selectedTemplateId}
        />
      </Suspense>
      <Suspense fallback={null}>
        <PlantTemplateDetailsModal
          open={isDetailsModalOpen}
          onClose={handleCloseDetails}
          plant={detailsPlant}
          loading={detailsLoading}
          onPlanter={handlePlanterFromDetails}
        />
      </Suspense>
    </Box>
  )
}