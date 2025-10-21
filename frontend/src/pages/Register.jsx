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
  useMediaQuery,
  useTheme,
  Snackbar,
  Alert as MuiAlert
} from '@mui/material';
import { PersonAddAlt, Visibility, VisibilityOff, ErrorOutline } from '@mui/icons-material';
import { api } from '../lib/axios';
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

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    if (password !== confirmPassword) {
      showSnackbar('❌ Les mots de passe ne correspondent pas');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await api.post('/register', { email, password });
      
      // Message de succès moderne
      showSnackbar('🎉 Compte créé avec succès ! Redirection vers la connexion...', 'success');
      
      // Réinitialisation du formulaire
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      
      // Redirection après délai
      setTimeout(() => {
        navigate({ to: '/login' });
      }, 2000);
      
    } catch (error) {
      console.error(error);
      
      // Messages d'erreur spécifiques
      if (error.response?.status === 409) {
        showSnackbar('📧 Un compte existe déjà avec cet email.');
      } else if (error.response?.status >= 500) {
        showSnackbar('🚧 Service temporairement indisponible. Veuillez réessayer.');
      } else if (error.message === 'Network Error') {
        showSnackbar('🌐 Problème de connexion. Vérifiez votre internet.');
      } else {
        showSnackbar('❌ Une erreur est survenue lors de l\'inscription.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    navigate({ to: '/login' });
  };

  return (
    <Box sx={loginStyles.container}>
      <Paper sx={loginStyles.paper}>
        {/* INVERSE L'ORDRE DES SECTIONS : Formulaire d'abord, puis visuel */}
        
        {/* Partie GAUCHE - Formulaire (maintenant en premier dans le DOM) */}
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
                  <PersonAddAlt sx={{ fontSize: isSmallScreen ? 20 : 24 }} />
                </Avatar>
              </Fade>
            </Box>

            {/* Titre et sous-titre */}
            <Box sx={loginStyles.titleSection}>
              <Typography 
                variant={isSmallScreen ? "h5" : "h4"} 
                sx={loginStyles.welcomeTitle}
              >
                Rejoignez-nous !
              </Typography>

              <Typography 
                variant="body2" 
                sx={loginStyles.subtitle}
              >
                Créez votre compte pour commencer à utiliser nos services
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
                sx={loginStyles.textField}
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

              <TextField
                label="Confirmer le mot de passe"
                type={showConfirmPassword ? 'text' : 'password'}
                variant="outlined"
                fullWidth
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                sx={{ mb: 3 }}
                size={isSmallScreen ? "small" : "medium"}
                placeholder="Confirmez votre mot de passe"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        size={isSmallScreen ? "small" : "medium"}
                        sx={{ 
                          color: ACCENT_ORANGE,
                          '&:hover': { color: PRIMARY_GREEN }
                        }}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Bouton d'inscription */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={loginStyles.loginButton(isSmallScreen)}
                disabled={loading}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Créer mon compte'}
              </Button>
            </Box>

            {/* Lien de connexion */}
            <Typography 
              variant="body2" 
              sx={loginStyles.subtitle}
            >
              Déjà un compte ? 
              <Typography 
                component="button" 
                onClick={handleLogin}
                sx={loginStyles.registerLink}
              >
                Se connecter
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

        {/* Partie DROITE - Visuel (maintenant en deuxième dans le DOM) */}
        {!isMobile && (
          <Box sx={loginStyles.visualSection}>
            <Fade in timeout={1000}>
              <Box sx={loginStyles.visualCard}>
                <Typography 
                  variant="h5" 
                  sx={loginStyles.visualTitle}
                >
                  Rejoignez notre communauté agricole
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={loginStyles.visualText}
                >
                  Accédez à des outils puissants pour optimiser votre production et suivre vos cultures en temps réel.
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