// src/hooks/useLoginForm.js (CORRIGÉ)
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuthForm } from './useAuthForm';
import { useSnackbar } from './useSnackbar';
import { api } from '../lib/axios';
import { authStore } from '../store/auth';

export function useLoginForm() {
    const navigate = useNavigate();
    const { 
        email, setEmail, 
        password, setPassword, // ✅ setPassword est bien retourné
        loading, setLoading, 
        emailError, setEmailError, 
        validateEmail, handleEmailChange, handleEmailBlur,
        showPassword, setShowPassword
    } = useAuthForm();
    const { showSnackbar, ...snackbarProps } = useSnackbar();
    
    // État pour le modal d'erreur
    const [errorModalOpen, setErrorModalOpen] = useState(false);
    const [errorModalTitle, setErrorModalTitle] = useState('');
    const [errorModalMessage, setErrorModalMessage] = useState('');
    
    // Fonction pour afficher une erreur dans le modal
    const showErrorModal = (title, message) => {
        setErrorModalTitle(title);
        setErrorModalMessage(message);
        setErrorModalOpen(true);
    };
    
    // --- Logique de validation spécifique au Login ---
    const validate = () => {
        if (!email) {
            showErrorModal('Champ requis', "Veuillez saisir votre adresse email pour vous connecter.");
            return false;
        }
        if (!validateEmail(email)) {
            showErrorModal('Format d\'email invalide', 'L\'adresse email que vous avez saisie n\'est pas valide. Veuillez vérifier et réessayer.');
            setEmailError('invalid');
            return false;
        }
        if (!password || password.length < 6) {
            showErrorModal('Mot de passe trop court', 'Votre mot de passe doit contenir au moins 6 caractères. Veuillez réessayer.');
            return false;
        }
        return true;
    };

    // --- Logique de soumission ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/login', { email, password });
            const token = res.data.token;
            authStore.setToken(token);
            
            showSnackbar('🎉 Connexion réussie ! Redirection en cours...', 'success');
            navigate({ to: '/dashboard' });

        } catch (err) {
            console.error(err);
            if (err.response?.status === 401) {
                showErrorModal(
                    'Mot de passe incorrect',
                    'Le mot de passe que vous avez saisi est incorrect. Veuillez vérifier votre mot de passe et réessayer.'
                );
            } else if (err.response?.status === 404) {
                showErrorModal(
                    'Compte introuvable',
                    'Aucun compte n\'a été trouvé avec cette adresse email. Vérifiez votre adresse email ou créez un nouveau compte.'
                );
            } else if (err.response?.status === 400) {
                const errorMsg = err.response?.data?.error || 'Les données envoyées sont invalides';
                showErrorModal('Erreur de validation', errorMsg);
            } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
                showErrorModal(
                    'Problème de connexion',
                    'Le serveur met trop de temps à répondre. Vérifiez votre connexion internet et réessayez.'
                );
            } else if (err.message === 'Network Error' || !err.response) {
                showErrorModal(
                    'Pas de connexion',
                    'Impossible de se connecter au serveur. Vérifiez votre connexion internet et réessayez.'
                );
            } else {
                showErrorModal(
                    'Erreur de connexion',
                    'Une erreur inattendue s\'est produite lors de la connexion. Veuillez réessayer dans quelques instants.'
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return {
        email, setEmail, 
        password, setPassword, // ✅ setPassword est inclus ici pour être utilisé dans le JSX
        loading, 
        emailError, handleEmailChange, handleEmailBlur, handleSubmit,
        showPassword, setShowPassword, ...snackbarProps, showSnackbar,
        // Props pour le modal d'erreur
        errorModalOpen,
        errorModalTitle,
        errorModalMessage,
        setErrorModalOpen,
    };
}
