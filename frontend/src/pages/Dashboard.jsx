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
  const [loading, setLoading] = useState(true)

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

          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Grass sx={{ fontSize: 50, color: 'green' }} />
                <Typography variant="h6" sx={{ mt: 2 }}>
                  🌿 Vos plantations
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                  Vos plantes et leur état s’afficheront ici.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
