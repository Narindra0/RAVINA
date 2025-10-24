import React, { useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Close,
  LocalFlorist,
  WaterDrop,
  WbSunny,
  CalendarMonth,
  LocationOn,
  Grass,
  InfoOutlined,
  AddCircleOutline,
} from '@mui/icons-material';

// Importez les styles pour le modal
import { dashboardStyles, PRIMARY_GREEN } from '../styles/Dashboard.styles';

// Données de sélection pour les champs du formulaire
const plantTypes = ['Légume', 'Fruit', 'Fleur', 'Aromatique', 'Arbre'];
const wateringFrequencies = ['Quotidien', 'Tous les 2 jours', 'Hebdomadaire', 'Bimensuel'];
const sunExposures = ['Plein soleil', 'Mi-ombre', 'Ombre'];
const bestSeasons = ['Printemps', 'Été', 'Automne', 'Hiver', 'Toute l\'année'];

export default function AddPlantModal({ open, onClose, onPlantAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    location: '',
    wateringFrequency: '',
    sunExposure: '',
    bestSeason: '',
    expectedHarvestDays: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    // Vérification simple des champs obligatoires
    if (!formData.name.trim() || !formData.type || !formData.location.trim()) {
      setError('Veuillez remplir au moins le Nom, le Type et le Lieu.');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    // NOTE: Ici, vous feriez normalement un appel API POST pour enregistrer la plante.
    // Par souci de simplicité et d'exécution dans cet environnement, nous simulons l'ajout.
    
    setTimeout(() => {
      // Construction de la nouvelle plante avec un ID simulé
      const newPlant = {
        ...formData,
        id: Date.now(), // ID unique simulé
        expectedHarvestDays: parseInt(formData.expectedHarvestDays) || 0,
      };

      onPlantAdded(newPlant); // Ajouter la plante au state du dashboard
      setIsSubmitting(false);
      onClose(); // Fermer le modal
      
      // Réinitialiser le formulaire
      setFormData({
        name: '',
        type: '',
        location: '',
        wateringFrequency: '',
        sunExposure: '',
        bestSeason: '',
        expectedHarvestDays: '',
        notes: '',
      });
    }, 1000); 
  };

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="add-plant-title">
      <Box sx={dashboardStyles.modalBox} component="form" onSubmit={handleSubmit}>
        
        {/* Header du Modal */}
        <Box sx={dashboardStyles.modalHeader}>
          <LocalFlorist sx={{ fontSize: 36, color: PRIMARY_GREEN, mr: 1.5 }} />
          <Typography 
            variant="h5" 
            component="h2" 
            id="add-plant-title" 
            sx={dashboardStyles.modalTitle}
          >
            Ajouter une nouvelle plantation
          </Typography>
          <IconButton onClick={onClose} sx={dashboardStyles.closeIcon}>
            <Close />
          </IconButton>
        </Box>

        {error && (
            <Alert severity="error" icon={<InfoOutlined />} sx={{ mb: 2 }}>
                {error}
            </Alert>
        )}

        <Grid container spacing={3} sx={dashboardStyles.formGrid}>
          {/* Ligne 1: Nom et Type */}
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Nom de la plante"
              name="name"
              value={formData.name}
              onChange={handleChange}
              variant="outlined"
              size="small"
              InputProps={{ startAdornment: <Grass sx={{ color: '#6c757d', mr: 1 }} /> }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small" required>
              <InputLabel>Type</InputLabel>
              <Select
                name="type"
                value={formData.type}
                onChange={handleChange}
                label="Type"
                variant="outlined"
              >
                {plantTypes.map((type) => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Ligne 2: Lieu et Saison */}
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Lieu (Ex: Pot A, Jardin Nord)"
              name="location"
              value={formData.location}
              onChange={handleChange}
              variant="outlined"
              size="small"
              InputProps={{ startAdornment: <LocationOn sx={{ color: '#6c757d', mr: 1 }} /> }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
             <FormControl fullWidth size="small">
              <InputLabel>Meilleure saison</InputLabel>
              <Select
                name="bestSeason"
                value={formData.bestSeason}
                onChange={handleChange}
                label="Meilleure saison"
                variant="outlined"
              >
                {bestSeasons.map((season) => (
                  <MenuItem key={season} value={season}>{season}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Ligne 3: Fréquence d'arrosage et Exposition au soleil */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Fréquence d'arrosage</InputLabel>
              <Select
                name="wateringFrequency"
                value={formData.wateringFrequency}
                onChange={handleChange}
                label="Fréquence d'arrosage"
                variant="outlined"
              >
                {wateringFrequencies.map((freq) => (
                  <MenuItem key={freq} value={freq}>
                    <Box display="flex" alignItems="center">
                      <WaterDrop sx={{ fontSize: 18, mr: 1, color: '#00bcd4' }} /> {freq}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Exposition au soleil</InputLabel>
              <Select
                name="sunExposure"
                value={formData.sunExposure}
                onChange={handleChange}
                label="Exposition au soleil"
                variant="outlined"
              >
                {sunExposures.map((exposure) => (
                  <MenuItem key={exposure} value={exposure}>
                    <Box display="flex" alignItems="center">
                      <WbSunny sx={{ fontSize: 18, mr: 1, color: '#ff9800' }} /> {exposure}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Ligne 4: Jours de récolte */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Jours avant récolte estimée (en jours)"
              name="expectedHarvestDays"
              value={formData.expectedHarvestDays}
              onChange={handleChange}
              type="number"
              variant="outlined"
              size="small"
              InputProps={{ 
                startAdornment: <CalendarMonth sx={{ color: '#6c757d', mr: 1 }} />,
                inputProps: { min: 0 } // Empêche les valeurs négatives
              }}
            />
          </Grid>

          {/* Ligne 5: Notes */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes supplémentaires (Ex: maladie, traitement spécial)"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              multiline
              rows={3}
              variant="outlined"
            />
          </Grid>
        </Grid>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={dashboardStyles.submitButton}
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <AddCircleOutline />}
        >
          {isSubmitting ? 'Ajout en cours...' : 'Enregistrer ma nouvelle plante'}
        </Button>
      </Box>
    </Modal>
  );
}
