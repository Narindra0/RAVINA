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
} from '@mui/material'
import { WbSunny, Grass, Logout } from '@mui/icons-material'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [plants, setPlants] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingPlants, setLoadingPlants] = useState(true)

  // Charger le profil utilisateur
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/user')
        setUser(res.data)
      } catch (error) {
        console.error('Erreur lors du chargement du profil utilisateur', error)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  // Charger les plantes
  useEffect(() => {
    const fetchPlants = async () => {
      try {
        const res = await api.get('/plants')
        
        // 🚨 CORRECTION CLÉ : L'API retourne 'member', pas 'hydra:member'
        const data = Array.isArray(res.data)
          ? res.data
          : res.data.member || [] // Utilisation de '.member'
          
        // Si vous utilisez une ancienne version de React/JS, vous pouvez aussi utiliser res.data['member']
        // const data = Array.isArray(res.data)
        //   ? res.data
        //   : res.data['member'] || []

        setPlants(data)
      } catch (error) {
        console.error('Erreur lors du chargement des plantes', error)
      } finally {
        setLoadingPlants(false)
      }
    }
    fetchPlants()
  }, [])

  if (!authStore.isAuthenticated()) {
    window.location.href = '/login'
    return null
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ backgroundColor: '#f9fbe7', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            🌱 OrientMada Dashboard
          </Typography>
          <Button
            color="inherit"
            startIcon={<Logout />}
            onClick={() => {
              authStore.clearToken()
              window.location.href = '/login'
            }}
          >
            Déconnexion
          </Button>
        </Toolbar>
      </AppBar>

      {/* Contenu principal */}
      <Container sx={{ py: 5 }}>
        <Box textAlign="center" mb={5}>
          <Avatar
            sx={{
              bgcolor: 'secondary.main',
              width: 70,
              height: 70,
              mx: 'auto',
              mb: 2,
              fontSize: 28,
            }}
          >
            {user?.email?.[0]?.toUpperCase()}
          </Avatar>
          <Typography variant="h5" gutterBottom>
            👋 Bienvenue, {user ? user.email : 'Chargement...'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Heureux de vous revoir ! Voici un aperçu de vos informations :
          </Typography>
        </Box>

        {/* Sections */}
        <Grid container spacing={4}>
          {/* Section météo */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <WbSunny sx={{ fontSize: 50, color: 'orange' }} />
                <Typography variant="h6" sx={{ mt: 2 }}>
                  🌤️ Météo
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                  Les informations météo apparaîtront ici.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Section plantations */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Grass sx={{ fontSize: 50, color: 'green' }} />
                <Typography variant="h6" sx={{ mt: 2 }}>
                  🌿 Vos plantations
                </Typography>

                {loadingPlants ? (
                  <CircularProgress sx={{ mt: 2 }} />
                ) : plants.length === 0 ? (
                  <Typography sx={{ mt: 2 }}>Aucune plante enregistrée.</Typography>
                ) : (
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    {plants.map((plant) => (
                      <Grid item xs={12} key={plant.id}>
                        <Card
                          variant="outlined"
                          sx={{
                            textAlign: 'left',
                            backgroundColor: '#f1f8e9',
                            borderRadius: 2,
                            p: 1,
                          }}
                        >
                          <Typography variant="subtitle1" fontWeight="bold">
                            🌱 {plant.name}
                          </Typography>
                          <Typography variant="body2">
                            Type : {plant.type}
                          </Typography>
                          <Typography variant="body2">
                            Lieu : {plant.location}
                          </Typography>
                          <Typography variant="body2">
                            ⏳ Récolte estimée : {plant.expectedHarvestDays} jours
                          </Typography>
                          {plant.notes && (
                            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                              📝 {plant.notes}
                            </Typography>
                          )}
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}