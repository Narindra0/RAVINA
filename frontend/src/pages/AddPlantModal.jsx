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
    const todayIso = new Date().toISOString().slice(0, 10);
    const [formData, setFormData] = useState({
        name: '',
        type: '',
        location: '',
        wateringFrequency: '',
        sunExposure: '',
        bestSeason: '',
        expectedHarvestDays: '',
        plantedAt: todayIso,
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

    // 🚀 Gestion de l'upload d'image (clic + drag&drop) avec compression simple
    const compressImageIfNeeded = async (file) => {
        try {
            if (!file.type.startsWith('image/')) return file;
            const bitmap = await createImageBitmap(file);
            const canvas = document.createElement('canvas');
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(bitmap, 0, 0);
            const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.8));
            return blob ? new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }) : file;
        } catch {
            return file;
        }
    };

    const applySelectedFile = async (file) => {
        const maybeCompressed = await compressImageIfNeeded(file);
        setImageFile(maybeCompressed);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(URL.createObjectURL(maybeCompressed));
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            await applySelectedFile(file);
        } else {
            handleRemoveImage();
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) await applySelectedFile(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
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
        if (!formData.name.trim() || !formData.type || !formData.location.trim() || !formData.plantedAt) {
            setError('Veuillez remplir les champs requis : Nom, Type, Lieu, Date.');
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
            plantedAt: todayIso,
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
            let value = formData[key];
            if (key === 'expectedHarvestDays') {
                value = (parseInt(formData[key]) || 0).toString();
            }
            if (key === 'plantedAt' && value) {
                // Normaliser au format YYYY-MM-DD
                value = String(value);
            }
            form.append(key, value);
        });

        if (imageFile) {
            form.append('imageFile', imageFile); 
        }
        
        try {
            const res = await api.post('/plants', form); 
            onPlantAdded(res.data); 
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

                        {/* Ligne 2b: Date de plantation */}
                        <Grid item xs={12} sm={6}>
                            <Box sx={addPlantStyles.formControl}> 
                                <TextField
                                    required fullWidth label="Date de plantation" name="plantedAt" type="date"
                                    value={formData.plantedAt}
                                    onChange={handleChange}
                                    variant="outlined" size="small"
                                    InputLabelProps={{ shrink: true }}
                                    InputProps={{ startAdornment: <CalendarMonth sx={{ color: '#6c757d', mr: 1 }} /> }}
                                />
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

                                {/* Zone de drop */}
                                <Box onDrop={handleDrop} onDragOver={handleDragOver} sx={{ mt: 1, p: 2, border: '1px dashed #cbd5e1', borderRadius: 1, color: '#64748b', textAlign: 'center' }}>
                                    Glissez-déposez une image ici
                                </Box>

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
                        disabled={isSubmitting || successMessage || !formData.name.trim() || !formData.type || !formData.location.trim() || !formData.plantedAt}
                        startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <AddCircleOutline />}
                    >
                        {isSubmitting ? 'Ajout en cours...' : 'Enregistrer ma nouvelle plante'}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
}