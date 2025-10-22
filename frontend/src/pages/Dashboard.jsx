import React, { useEffect, useState } from 'react'
import { authStore } from '../store/auth'
import { api } from '../lib/axios'
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Box,
  Avatar,
  Divider,
} from '@mui/material'
import {
  Grass,
  CalendarMonth,
  Logout,
  WaterDrop,
  LightMode,
  AddCircleOutline, // Nouvelle icône pour ajouter une plante
} from '@mui/icons-material'

// Importez les nouveaux styles
import { dashboardStyles, DARK_GREEN, ACCENT_ORANGE, PRIMARY_GREEN } from './Dashboard.styles'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [plants, setPlants] = useState([])
  const [suggestions, setSuggestions] = useState(null)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      let isError = false
      setLoadingData(true)
      
      // ... (Logique de chargement des données - inchangée) ...
      
      // --- 1. Charger le profil utilisateur ---
      try {
        const userRes = await api.get('/user')
        setUser(userRes.data)
      } catch (error) {
        console.error('Erreur lors du chargement du profil utilisateur', error)
        isError = true
      }

      // --- 2. Charger les plantes de l'utilisateur ---
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

      // --- 3. Charger les suggestions (basé sur la saison) ---
      try {
        const suggestionsRes = await api.get('/suggestions/plants')
        setSuggestions(suggestionsRes.data)
      } catch (error) {
        console.error('Erreur lors du chargement des suggestions', error)
      } finally {
        setLoadingData(false)
        if (isError) {
          console.warn(
            "Certaines données n'ont pas pu être chargées, mais l'utilisateur est authentifié."
          )
        }
      }
    }
    fetchData()
  }, [])

  if (!authStore.isAuthenticated()) {
    window.location.href = '/login'
    return null
  }

  // Fonctions utilitaires
  const getAvatarFallback = (email) => (email?.[0]?.toUpperCase() || '?')
  const handleLogout = () => {
    authStore.clearToken()
    window.location.href = '/login'
  }

  // Écran de chargement
  if (loadingData) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          // Utilisation du fond défini
          backgroundColor: dashboardStyles.root.backgroundColor,
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    )
  }


  // --- Rendu du Dashboard ---
  return (
    // 1. Utilisation du style 'root'
    <Box sx={dashboardStyles.root}>
      
      {/* Header */}
      <AppBar position="static" sx={dashboardStyles.appBar}>
        <Toolbar>
          <Typography variant="h6" sx={{ ...dashboardStyles.title, fontWeight: 800, letterSpacing: '-0.01em' }}>
            🌱 OrientMada Dashboard
          </Typography>
          {user && (
            <Box display="flex" alignItems="center" mr={2}>
              <Avatar sx={dashboardStyles.avatar}>
                {getAvatarFallback(user.email)}
              </Avatar>
              <Typography variant="body1" sx={{ display: { xs: 'none', sm: 'block' } }}>
                {user.email}
              </Typography>
            </Box>
          )}
          <Button
            color="inherit"
            startIcon={<Logout />}
            onClick={handleLogout}
            sx={dashboardStyles.logoutButton}
          >
            Déconnexion
          </Button>
        </Toolbar>
      </AppBar>

      {/* Contenu principal */}
      {/* 2. Utilisation du style 'container' */}
      <Container sx={dashboardStyles.container}>
        <Box textAlign="center" mb={5}>
          {/* 3. Utilisation du style 'welcomeText' */}
          <Typography variant="h4" gutterBottom sx={dashboardStyles.welcomeText}>
            Bienvenue, {user ? user.email.split('@')[0] : 'Jardinier'} !
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gérez vos plantations et découvrez les suggestions saisonnières.
          </Typography>
        </Box>

        {/* SECTION - SUGGESTIONS BASÉES SUR LA SAISON */}
        <Card sx={{ ...dashboardStyles.mainCard, ...dashboardStyles.suggestionsCard, mb: 4 }}>
          <CardContent sx={{ p: 3 }}>
            {/* Header avec date et saison */}
            <Box display="flex" alignItems="center" mb={3}>
              <CalendarMonth sx={{ 
                fontSize: 24, 
                color: '#6c757d', 
                mr: 2 
              }} />
              <Box>
                <Typography variant="h6" sx={{ 
                  fontWeight: 500, 
                  color: '#495057',
                  mb: 0.5
                }}>
                  Aujourd'hui : {new Date().toLocaleDateString('fr-FR', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: '#6c757d',
                  fontWeight: 500
                }}>
                  Saison : {suggestions?.currentSeason || 'Chargement...'}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2, borderColor: '#dee2e6' }} />

            <Typography variant="h6" sx={{ 
              mb: 3, 
              color: '#495057',
              fontWeight: 500
            }}>
              Voici les plantes idéales à cultiver ce mois-ci
            </Typography>

            {suggestions && suggestions.suggestions && suggestions.suggestions.length > 0 ? (
              <Grid container spacing={2}>
                {suggestions.suggestions.map((plant) => (
                  <Grid item xs={12} sm={6} md={4} key={plant.id}>
                    <Card sx={{
                      backgroundColor: 'white',
                      borderRadius: 2,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      border: '1px solid #e9ecef',
                      p: 2,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      {/* Placeholder pour l'image */}
                      <Box sx={{
                        height: 120,
                        backgroundColor: '#f8f9fa',
                        borderRadius: 1,
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #e9ecef'
                      }}>
                        <Typography variant="body2" color="text.secondary">
                          🌱 Image
                        </Typography>
                      </Box>
                      
                      {/* Nom de la plante */}
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 600,
                        color: '#495057',
                        mb: 1
                      }}>
                        {plant.name}
                      </Typography>
                      
                      {/* Détails */}
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" sx={{ 
                          color: '#6c757d',
                          mb: 0.5,
                          fontWeight: 500
                        }}>
                          {plant.type}
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: '#6c757d',
                          mb: 0.5
                        }}>
                          {plant.wateringFrequency || 'Arrosage non spécifié'}
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: '#6c757d'
                        }}>
                          {plant.sunExposure || 'Exposition non spécifiée'}
                        </Typography>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ 
                textAlign: 'center', 
                py: 4,
                color: '#6c757d'
              }}>
                <Typography variant="body1">
                  Aucune suggestion pour la saison actuelle.
                </Typography>
              </Box>
            )}

            {/* Bouton "Voir toutes les plantes" */}
            <Box sx={{ 
              textAlign: 'center', 
              mt: 3,
              p: 2,
              backgroundColor: '#f8f9fa',
              borderRadius: 2,
              border: '1px solid #e9ecef'
            }}>
              <Button 
                variant="outlined"
                sx={{
                  borderColor: '#6c757d',
                  color: '#495057',
                  textTransform: 'none',
                  px: 3,
                  py: 1,
                  '&:hover': {
                    borderColor: '#495057',
                    backgroundColor: '#f8f9fa'
                  }
                }}
              >
                Voir toutes les plantes
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* SECTION - VOS PLANTATIONS */}
        {/* 6. Utilisation des styles de carte */}
        <Card sx={{ ...dashboardStyles.mainCard, ...dashboardStyles.plantsCard }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <Grass sx={{ fontSize: 32, color: PRIMARY_GREEN }} />
                <Typography variant="h5" color={DARK_GREEN} fontWeight={700}>
                  Vos plantations
                </Typography>
                <Box sx={dashboardStyles.plantBadge}>{plants.length} enregistrées</Box>
              </Box>
              <Button variant="outlined" sx={dashboardStyles.smallGhostButton} startIcon={<AddCircleOutline />}>
                Ajouter
              </Button>
            </Box>
            <Divider sx={{ my: 2 }} />

            {plants.length === 0 ? (
              <Typography sx={{ mt: 2, color: 'text.secondary' }}>
                Vous n'avez encore enregistré aucune plante.
              </Typography>
            ) : (
              <Grid container spacing={3} sx={{ mt: 1 }}>
                {plants.map((plant) => (
                  <Grid item xs={12} sm={6} md={4} key={plant.id}>
                    <Card variant="outlined" sx={dashboardStyles.plantItemCard}>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="h6" sx={dashboardStyles.plantName}>{plant.name}</Typography>
                        <Box sx={dashboardStyles.plantBadge}>{plant.type}</Box>
                      </Box>

                      <Typography variant="body2" color="text.secondary">
                        Lieu : {plant.location || 'N/A'}
                      </Typography>

                      <Box sx={dashboardStyles.plantMetricsRow}>
                        <Typography variant="body2" sx={dashboardStyles.plantMetric}>Saison: {plant.bestSeason || 'N/A'}</Typography>
                        <Typography variant="body2" sx={dashboardStyles.plantMetric}>Récolte: {plant.expectedHarvestDays} j</Typography>
                        <Typography variant="body2" sx={dashboardStyles.plantMetric}>Arrosage: {plant.wateringFrequency || 'N/A'}</Typography>
                        <Typography variant="body2" sx={dashboardStyles.plantMetric}>Soleil: {plant.sunExposure || 'N/A'}</Typography>
                      </Box>

                      {plant.notes && (
                        <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1 }}>
                          {plant.notes}
                        </Typography>
                      )}

                      <Box sx={dashboardStyles.cardActionsRow}></Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}

            <Box textAlign="center">
              <Button 
                variant="contained" 
                startIcon={<AddCircleOutline />}
                sx={dashboardStyles.addPlantButton}
              >
                Ajouter une nouvelle plante
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}