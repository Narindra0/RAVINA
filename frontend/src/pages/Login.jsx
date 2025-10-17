import React, { useState } from 'react'
import { api } from '../lib/axios'
import { authStore } from '../store/auth'

// Import MUI
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  Avatar,
  CircularProgress,
} from '@mui/material'
import { LockOutlined } from '@mui/icons-material'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const res = await api.post('/login', { email, password })
      const token = res.data.token
      authStore.setToken(token)
      setSuccess('✅ Connexion réussie !')
      console.log('Token stocké :', token)
    } catch (err) {
      console.error(err)
      setError('❌ Identifiants incorrects ou problème serveur.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #e8f5e9, #f1f8e9)',
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: 4,
          width: 400,
          textAlign: 'center',
          borderRadius: 3,
        }}
      >
        {/* Icône en haut */}
        <Avatar sx={{ m: 'auto', bgcolor: 'primary.main' }}>
          <LockOutlined />
        </Avatar>

        <Typography variant="h5" sx={{ mt: 2, fontWeight: 'bold', color: 'primary.main' }}>
          Connexion
        </Typography>

        {/* Message de succès ou d’erreur */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}

        {/* Formulaire */}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            label="Mot de passe"
            type="password"
            fullWidth
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            disabled={loading}
            sx={{ py: 1.2 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Se connecter'}
          </Button>
        </Box>

        <Typography variant="body2" sx={{ mt: 3, color: 'text.secondary' }}>
          Vous n’avez pas encore de compte ? <a href="/register">Créer un compte</a>
        </Typography>
      </Paper>
    </Box>
  )
}
