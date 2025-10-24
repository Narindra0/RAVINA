import React, { useEffect, useState } from 'react'
import { authStore } from '../store/auth'
import { api } from '../lib/axios'
import AddPlantModal from './AddPlantModal'
import Sidebar from './Sidebar'
import {
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Box,
  Typography,
  Divider,
} from '@mui/material'
import {
  CalendarMonth,
  AddCircleOutline,
  ArrowForward,
  WaterDrop,
  WbSunny,
  Schedule,
} from '@mui/icons-material'

import { dashboardStyles } from '../styles/Dashboard.styles'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [plants, setPlants] = useState([])
  const [suggestions, setSuggestions] = useState(null)
  const [loadingData, setLoadingData] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  const handleAddPlant = (newPlant) => {
    setPlants([...plants, newPlant])
  }

  useEffect(() => {
    const fetchData = async () => {
      let isError = false
      setLoadingData(true)
      
      try {
        const userRes = await api.get('/user')
        setUser(userRes.data)
      } catch (error) {
        console.error('Erreur lors du chargement du profil utilisateur', error)
        isError = true
      }

      try {
        const plantsRes = await api.get('/plants')
        const plantData = Array.isArray(plantsRes.data)
          ? plantsRes.data
          : plantsRes.data['member'] || []
        setPlants(plantData)
      } catch (error) {
        console.error('Erreur lors du chargement des plantes', error)
        isError = true
      }

      try {
        const suggestionsRes = await api.get('/suggestions/plants')
        setSuggestions(suggestionsRes.data)
      } catch (error) {
        console.error('Erreur lors du chargement des suggestions', error)
      } finally {
        setLoadingData(false)
        if (isError) {
          console.warn("Certaines données n'ont pas pu être chargées.")
        }
      }
    }
    fetchData()
  }, [])

  if (!authStore.isAuthenticated()) {
    window.location.href = '/login'
    return null
  }

  if (loadingData) {
    return (
      <Box sx={dashboardStyles.loadingContainer}>
        <CircularProgress sx={{ color: '#10b981' }} size={50} />
      </Box>
    )
  }

  return (
    <Box sx={dashboardStyles.root}>
      {/* Sidebar */}
      <Sidebar user={user} />

      {/* Main Content */}
      <Box sx={dashboardStyles.mainContent}>
        <Container maxWidth="xl" sx={dashboardStyles.container}>
          
          {/* Header */}
          <Box sx={dashboardStyles.headerSection}>
            <Typography variant="h3" sx={dashboardStyles.welcomeTitle}>
              Bienvenue sur OrientMada,
            </Typography>
            <Typography variant="h6" sx={dashboardStyles.welcomeSubtitle}>
              Bonjour {user ? user.email.split('@')[0] : 'Jayesh'},
            </Typography>
          </Box>

          {/* Feature Banner */}
          <Card sx={dashboardStyles.featureBanner}>
            <Box sx={dashboardStyles.featureBannerOverlay} />
            <Box sx={dashboardStyles.featureBannerPattern} />
            <CardContent sx={dashboardStyles.featureBannerContent}>
              <Typography variant="h3" sx={dashboardStyles.featureBannerTitle}>
                A venir
              </Typography>
              <Typography variant="h6" sx={dashboardStyles.featureBannerText}>
                Vous pouvez savoir le meteo en temps reel
              </Typography>
            </CardContent>
          </Card>

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
              <Grid container spacing={3}>
                {suggestions.suggestions.map((plant) => (
                  <Grid item xs={12} sm={6} md={4} key={plant.id}>
                    <Card sx={dashboardStyles.suggestionCard}>
                      <Box sx={dashboardStyles.suggestionCardImage}>
                        <Typography variant="h3">🌱</Typography>
                      </Box>
                      <CardContent>
                        <Typography variant="h6" sx={dashboardStyles.suggestionCardTitle}>
                          {plant.name}
                        </Typography>
                        <Typography variant="body2" sx={dashboardStyles.suggestionCardType}>
                          {plant.type}
                        </Typography>
                        <Box sx={dashboardStyles.suggestionCardInfo}>
                          <WaterDrop sx={{ fontSize: 16, color: '#3b82f6' }} />
                          <Typography variant="body2" sx={dashboardStyles.suggestionCardInfoText}>
                            {plant.wateringFrequency || 'Non spécifié'}
                          </Typography>
                        </Box>
                      </CardContent>
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
                Mes plantations
              </Typography>
              <Button 
                endIcon={<ArrowForward />}
                sx={dashboardStyles.viewAllButton}
              >
                Voir toutes
              </Button>
            </Box>

            {plants.length === 0 ? (
              <Box sx={dashboardStyles.emptyState}>
                <Typography>Vous n'avez encore enregistré aucune plante.</Typography>
              </Box>
            ) : (
              <Grid container spacing={4}>
                {plants.map((plant) => (
                  <Grid item xs={12} sm={6} md={4} key={plant.id}>
                    <Card sx={dashboardStyles.plantCard}>
                      <Box sx={dashboardStyles.plantCardImage}>
                        <Typography variant="h1" sx={{ fontSize: 80 }}>🪴</Typography>
                      </Box>
                      <CardContent>
                        <Typography variant="h6" sx={dashboardStyles.plantCardTitle}>
                          {plant.name}
                        </Typography>
                        <Box sx={dashboardStyles.plantCardBadge}>
                          {plant.type}
                        </Box>

                        <Box sx={dashboardStyles.plantCardDetails}>
                          <Box sx={dashboardStyles.plantCardDetailItem}>
                            <WaterDrop sx={{ fontSize: 18, color: '#3b82f6' }} />
                            <Typography variant="body2">{plant.wateringFrequency || 'N/A'}</Typography>
                          </Box>
                          <Box sx={dashboardStyles.plantCardDetailItem}>
                            <WbSunny sx={{ fontSize: 18, color: '#fbbf24' }} />
                            <Typography variant="body2">{plant.sunExposure || 'N/A'}</Typography>
                          </Box>
                          <Box sx={dashboardStyles.plantCardDetailItem}>
                            <Schedule sx={{ fontSize: 18, color: '#6b7280' }} />
                            <Typography variant="body2">Récolte: {plant.expectedHarvestDays}j</Typography>
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
      </Box>

      {/* Modal */}
      <AddPlantModal 
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onPlantAdded={handleAddPlant}
      />
    </Box>
  )
}