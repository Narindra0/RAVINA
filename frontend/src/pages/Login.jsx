import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Avatar,
  CircularProgress,
  InputAdornment,
  IconButton,
  Fade,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert as MuiAlert
} from '@mui/material';
import { Cloud, Visibility, VisibilityOff, ErrorOutline } from '@mui/icons-material';
import { api } from '../lib/axios';
import { authStore } from '../store/auth';
import { 
  loginStyles, 
  PRIMARY_GREEN, 
  BACKGROUND_COLOR, 
  ACCENT_ORANGE, 
  ERROR_RED 
} from './loginPage.styles';

// Composant Alert personnalisé pour les notifications
const CustomAlert = React.forwardRef(function CustomAlert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('error');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const showSnackbar = (message, severity = 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    // Validation en temps réel mais pas d'affichage d'erreur immédiat
    if (value && !validateEmail(value)) {
      setEmailError('invalid');
    } else {
      setEmailError('');
    }
  };

  const validateForm = () => {
    if (!email) {
      showSnackbar('L\'adresse email est requise');
      return false;
    }
    
    if (!validateEmail(email)) {
      showSnackbar('Veuillez saisir une adresse email valide');
      return false;
    }

    if (!password) {
      showSnackbar('Le mot de passe est requis');
      return false;
    }

    if (password.length < 6) {
      showSnackbar('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation complète du formulaire avant soumission
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/login', { email, password });
      const token = res.data.token;
      authStore.setToken(token);
      
      // Message de succès moderne
      showSnackbar('🎉 Connexion réussie ! Redirection en cours...', 'success');
      console.log('Token stocké :', token);
      
      // Redirection après délai avec TanStack Router
      setTimeout(() => {
        navigate({ to: '/dashboard' });
      }, 2000);
      
    } catch (err) {
      console.error(err);
      
      // Messages d'erreur modernes et spécifiques
      if (err.response?.status === 401) {
        showSnackbar('🔐 Identifiants incorrects. Vérifiez votre email et mot de passe.');
      } else if (err.response?.status === 404) {
        showSnackbar('👤 Aucun compte trouvé avec cet email.');
      } else if (err.response?.status >= 500) {
        showSnackbar('🚧 Service temporairement indisponible. Veuillez réessayer.');
      } else if (err.message === 'Network Error') {
        showSnackbar('🌐 Problème de connexion. Vérifiez votre internet.');
      } else {
        showSnackbar('❌ Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fonctions de navigation pour les liens
  const handleForgotPassword = (e) => {
    e.preventDefault();
    navigate({ to: '/forgot-password' });
  };

  const handleRegister = (e) => {
    e.preventDefault();
    navigate({ to: '/register' });
  };

  return (
    <Box sx={loginStyles.container}>
      <Paper sx={loginStyles.paper}>
        {/* Partie Gauche - Formulaire */}
        <Box sx={loginStyles.formContainer}>
          <Box sx={loginStyles.formContent}>
            {/* En-tête avec logo et icône */}
            <Box sx={loginStyles.header}>
              <Typography 
                variant={isSmallScreen ? "h5" : "h4"} 
                sx={loginStyles.mainTitle}
              >
                <span style={{ color: PRIMARY_GREEN }}>Orient</span>
                <span style={{ color: ACCENT_ORANGE }}>Mada</span>
              </Typography>
              
              <Fade in timeout={800}>
                <Avatar 
                  sx={loginStyles.avatar(isSmallScreen, isHovered)}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  <Cloud sx={{ fontSize: isSmallScreen ? 20 : 24 }} />
                </Avatar>
              </Fade>
            </Box>

            {/* Titre et sous-titre */}
            <Box sx={loginStyles.titleSection}>
              <Typography 
                variant={isSmallScreen ? "h5" : "h4"} 
                sx={loginStyles.welcomeTitle}
              >
                Content de vous revoir !
              </Typography>

              <Typography 
                variant="body2" 
                sx={loginStyles.subtitle}
              >
                Connectez-vous pour accéder à votre tableau de bord
              </Typography>
            </Box>

            {/* Formulaire */}
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                label="Adresse Email"
                type="email"
                variant="outlined"
                fullWidth
                required
                value={email}
                onChange={handleEmailChange}
                error={!!emailError}
                sx={loginStyles.textField}
                size={isSmallScreen ? "small" : "medium"}
                placeholder="votre@email.com"
                InputProps={{
                  endAdornment: emailError && (
                    <InputAdornment position="end">
                      <ErrorOutline sx={{ color: ERROR_RED, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                helperText={emailError ? "Format d'email invalide" : ""}
              />

              <TextField
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                fullWidth
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 1 }}
                size={isSmallScreen ? "small" : "medium"}
                placeholder="Votre mot de passe"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size={isSmallScreen ? "small" : "medium"}
                        sx={{ 
                          color: ACCENT_ORANGE,
                          '&:hover': { color: PRIMARY_GREEN }
                        }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              {/* Mot de passe oublié */}
              <Box sx={{ textAlign: 'right', mb: 3 }}>
                <Typography 
                  component="button" 
                  onClick={handleForgotPassword}
                  sx={loginStyles.forgotPasswordButton}
                >
                  Mot de passe oublié ?
                </Typography>
              </Box>

              {/* Bouton de connexion */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={loginStyles.loginButton(isSmallScreen)}
                disabled={loading}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Se connecter'}
              </Button>
            </Box>

            {/* Lien d'inscription */}
            <Typography 
              variant="body2" 
              sx={loginStyles.subtitle}
            >
              Nouveau sur OrientMada ? 
              <Typography 
                component="button" 
                onClick={handleRegister}
                sx={loginStyles.registerLink}
              >
                Créer un compte
              </Typography>
            </Typography>
            
            {/* Copyright */}
            <Typography 
              variant="caption" 
              sx={loginStyles.copyright}
            >
              © 2024 OrientMada. Tous droits réservés.
            </Typography>
          </Box>
        </Box>

        {/* Partie Droite - Visuel */}
        {!isMobile && (
          <Box sx={loginStyles.visualSection}>
            <Fade in timeout={1000}>
              <Box sx={loginStyles.visualCard}>
                <Typography 
                  variant="h5" 
                  sx={loginStyles.visualTitle}
                >
                  Des données précises pour une agriculture intelligente
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={loginStyles.visualText}
                >
                  Accédez à des prévisions météo hyper-locales et surveillez la santé de vos cultures en temps réel.
                </Typography>
              </Box>
            </Fade>
          </Box>
        )}
      </Paper>

      {/* Snackbar pour les messages modernes */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <CustomAlert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity}
          sx={loginStyles.snackbarAlert}
        >
          {snackbarMessage}
        </CustomAlert>
      </Snackbar>
    </Box>
  );
}