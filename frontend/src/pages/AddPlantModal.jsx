import React, { useState, useEffect } from 'react';
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
    InputAdornment,
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
    CloudUpload,
    DeleteOutline, // 🚀 NOUVEAU : Icône de suppression
} from '@mui/icons-material';

import { api } from '../lib/axios';
import { addPlantStyles, PRIMARY_GREEN } from '../styles/AddPlant.styles';

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
    
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null); 
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState(''); 

    // 💡 Nettoyage de l'URL de prévisualisation lorsque le modal se ferme
    useEffect(() => {
        if (!open && imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
    }, [open, imagePreview]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // 🚀 Gestion de l'upload d'image
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            if (imagePreview) URL.revokeObjectURL(imagePreview); // Nettoie l'ancien si on en choisit un nouveau
            setImagePreview(URL.createObjectURL(file));
        } else {
            handleRemoveImage();
        }
    };

    // 🚀 Fonction pour supprimer l'image
    const handleRemoveImage = () => {
        setImageFile(null);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
        // Important: Réinitialiser l'input file pour pouvoir re-téléverser le même fichier
        document.getElementById("upload-image-button").value = null;
    }

    const validateForm = () => {
        // ... (validation inchangée)
        if (!formData.name.trim() || !formData.type || !formData.location.trim()) {
            setError('Veuillez remplir au moins le Nom, le Type et le Lieu.');
            return false;
        }
        if (imageFile && !imageFile.type.startsWith('image/')) {
            setError('Le fichier sélectionné n\'est pas une image valide.');
            return false;
        }

        setError('');
        setSuccessMessage('');
        return true;
    };

    const resetForm = () => {
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
        handleRemoveImage(); // Utilise la fonction de suppression
        setError('');
        setSuccessMessage('');
    };

    const handleCloseModal = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        setError('');

        const form = new FormData();

        Object.keys(formData).forEach(key => {
            const value = key === 'expectedHarvestDays' 
                ? (parseInt(formData[key]) || 0).toString() 
                : formData[key];
            form.append(key, value);
        });

        if (imageFile) {
            form.append('imageFile', imageFile); 
        }
        
        try {
            await api.post('/plants', form); 
            // Note: L'appel à onPlantAdded devrait idéalement se faire avec la donnée de réponse (response.data)
            // Assurez-vous que l'API renvoie la nouvelle plante.
            onPlantAdded(formData); 
            setSuccessMessage('Plante ajoutée avec succès !');

            setTimeout(handleCloseModal, 1000); 

        } catch (err) {
            console.error('Erreur lors de l\'ajout de la plante:', err);
            const apiError = err.response?.data?.detail 
                || err.response?.data?.violations?.[0]?.message 
                || 'Une erreur inconnue est survenue lors de l\'enregistrement.';
            setError(apiError);

        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal open={open} onClose={handleCloseModal} aria-labelledby="add-plant-title">
            <Box sx={addPlantStyles.modalBox}> 
            
                {/* Header du Modal */}
                <Box sx={addPlantStyles.modalHeader}>
                    <LocalFlorist sx={{ fontSize: 36, color: PRIMARY_GREEN, mr: 1.5 }} />
                    <Typography  
                        variant="h5"  
                        component="h2"  
                        id="add-plant-title"  
                        sx={addPlantStyles.modalTitle}
                    >
                        Ajouter une nouvelle plantation
                    </Typography>
                    <IconButton onClick={handleCloseModal} sx={addPlantStyles.closeIcon}>
                        <Close />
                    </IconButton>
                </Box>

                {error && <Alert severity="error" icon={<InfoOutlined />} sx={{ mb: 2 }}>{error}</Alert>}
                {successMessage && <Alert severity="success" icon={<AddCircleOutline />} sx={{ mb: 2 }}>{successMessage}</Alert>}

                <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        
                        {/* Ligne 1: Nom et Type */}
                        <Grid item xs={12} sm={6}>
                            <Box sx={addPlantStyles.formControl}> 
                                <TextField
                                    required fullWidth label="Nom de la plante" name="name"
                                    value={formData.name} onChange={handleChange} variant="outlined" size="small"
                                    InputProps={{ startAdornment: <Grass sx={{ color: '#6c757d', mr: 1 }} /> }}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Box sx={addPlantStyles.formControl}> 
                                <FormControl fullWidth size="small" required>
                                    <InputLabel>Type</InputLabel>
                                    <Select name="type" value={formData.type} onChange={handleChange} label="Type" variant="outlined">
                                        {plantTypes.map((type) => (<MenuItem key={type} value={type}>{type}</MenuItem>))}
                                    </Select>
                                </FormControl>
                            </Box>
                        </Grid>
                    
                        {/* Ligne 2: Lieu et Saison */}
                        <Grid item xs={12} sm={6}>
                            <Box sx={addPlantStyles.formControl}> 
                                <TextField
                                    required fullWidth label="Lieu (Ex: Pot A, Jardin Nord)" name="location"
                                    value={formData.location} onChange={handleChange} variant="outlined" size="small"
                                    InputProps={{ startAdornment: <LocationOn sx={{ color: '#6c757d', mr: 1 }} /> }}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Box sx={addPlantStyles.formControl}> 
                                <FormControl fullWidth size="small">
                                    <InputLabel>Meilleure saison</InputLabel>
                                    <Select name="bestSeason" value={formData.bestSeason} onChange={handleChange} label="Meilleure saison" variant="outlined">
                                        {bestSeasons.map((season) => (<MenuItem key={season} value={season}>{season}</MenuItem>))}
                                    </Select>
                                </FormControl>
                            </Box>
                        </Grid>

                        {/* Ligne 3: Fréquence d'arrosage et Exposition au soleil */}
                        <Grid item xs={12} sm={6}>
                            <Box sx={addPlantStyles.formControl}> 
                                <FormControl fullWidth size="small">
                                    <InputLabel>Fréquence d'arrosage</InputLabel>
                                    <Select name="wateringFrequency" value={formData.wateringFrequency} onChange={handleChange} label="Fréquence d'arrosage" variant="outlined">
                                        {wateringFrequencies.map((freq) => (
                                            <MenuItem key={freq} value={freq}>
                                                <Box display="flex" alignItems="center"><WaterDrop sx={{ fontSize: 18, mr: 1, color: '#00bcd4' }} /> {freq}</Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Box sx={addPlantStyles.formControl}> 
                                <FormControl fullWidth size="small">
                                    <InputLabel>Exposition au soleil</InputLabel>
                                    <Select name="sunExposure" value={formData.sunExposure} onChange={handleChange} label="Exposition au soleil" variant="outlined">
                                        {sunExposures.map((exposure) => (
                                            <MenuItem key={exposure} value={exposure}>
                                                <Box display="flex" alignItems="center"><WbSunny sx={{ fontSize: 18, mr: 1, color: '#ff9800' }} /> {exposure}</Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        </Grid>

                        {/* Ligne 4: Jours de récolte */}
                        <Grid item xs={12}>
                            <Box sx={addPlantStyles.formControl}> 
                                <TextField
                                    fullWidth label="Jours avant récolte estimée" name="expectedHarvestDays"
                                    value={formData.expectedHarvestDays} onChange={handleChange} type="number"
                                    variant="outlined" size="small"
                                    InputProps={{ 
                                        startAdornment: <CalendarMonth sx={{ color: '#6c757d', mr: 1 }} />,
                                        inputProps: { min: 0 },
                                        endAdornment: <InputAdornment position="end">jours</InputAdornment>
                                    }}
                                />
                            </Box>
                        </Grid>

                        {/* Ligne 5: Upload de l'image (Amélioré) */}
                        <Grid item xs={12}>
                            <Box sx={addPlantStyles.imageUploadContainer}>
                                <Grid container spacing={1} alignItems="center" justifyContent="center">
                                    <Grid item>
                                        <input
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            id="upload-image-button"
                                            type="file"
                                            onChange={handleImageChange}
                                        />
                                        <label htmlFor="upload-image-button">
                                            <Button
                                                variant="outlined"
                                                component="span"
                                                startIcon={<CloudUpload />}
                                                sx={addPlantStyles.uploadButton}
                                            >
                                                {imageFile ? imageFile.name : 'Choisir une image pour la plante'}
                                            </Button>
                                        </label>
                                    </Grid>
                                    {imageFile && (
                                        <Grid item>
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                onClick={handleRemoveImage}
                                                startIcon={<DeleteOutline />}
                                                sx={{ 
                                                    ...addPlantStyles.uploadButton, 
                                                    color: '#f44336', 
                                                    borderColor: '#f44336',
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(244, 67, 54, 0.04)',
                                                        borderColor: '#f44336',
                                                    }
                                                }}
                                            >
                                                Supprimer
                                            </Button>
                                        </Grid>
                                    )}
                                </Grid>

                                {imagePreview && (
                                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                                        <img 
                                            src={imagePreview} 
                                            alt="Aperçu" 
                                            style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '8px', objectFit: 'cover' }} 
                                        />
                                    </Box>
                                )}
                            </Box>
                        </Grid>

                        {/* Ligne 6: Notes */}
                        <Grid item xs={12}>
                            <Box sx={addPlantStyles.formControl}> 
                                <TextField
                                    fullWidth label="Notes supplémentaires (Ex: maladie, traitement spécial)" name="notes"
                                    value={formData.notes} onChange={handleChange} multiline rows={3} variant="outlined"
                                />
                            </Box>
                        </Grid>
                    </Grid>

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={addPlantStyles.submitButton}
                        disabled={isSubmitting || successMessage}
                        startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <AddCircleOutline />}
                    >
                        {isSubmitting ? 'Ajout en cours...' : 'Enregistrer ma nouvelle plante'}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
}