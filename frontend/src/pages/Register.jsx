import React, { useState } from 'react'
import { api } from '../lib/axios'
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
import { PersonAddAlt } from '@mui/icons-material'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')

    if (password !== confirmPassword) {
      setError('❌ Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)
    try {
      await api.post('/register', { email, password })
      setMessage('✅ Compte créé avec succès, vous pouvez vous connecter.')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error(error)
      setError('❌ Une erreur est survenue lors de l’inscription.')
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
        <Avatar sx={{ m: 'auto', bgcolor: 'primary.main' }}>
          <PersonAddAlt />
        </Avatar>

        <Typography variant="h5" sx={{ mt: 2, fontWeight: 'bold', color: 'primary.main' }}>
          Créer un compte
        </Typography>

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mt: 2 }}>{message}</Alert>}

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
            sx={{ mb: 2 }}
          />
          <TextField
            label="Confirmer le mot de passe"
            type="password"
            fullWidth
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? <CircularProgress size={24} color="inherit" /> : 'S’inscrire'}
          </Button>
        </Box>

        <Typography variant="body2" sx={{ mt: 3, color: 'text.secondary' }}>
          Déjà un compte ? <a href="/login">Se connecter</a>
        </Typography>
      </Paper>
    </Box>
  )
}
