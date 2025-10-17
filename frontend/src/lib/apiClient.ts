// src/lib/apiClient.ts
import axios from 'axios';
import { authStore } from '../stores/authStore';

// Créer une instance axios avec la base URL de votre API Symfony
export const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', // Ajustez selon votre configuration
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT à chaque requête
apiClient.interceptors.request.use(
  (config) => {
    const token = authStore.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs d'authentification
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      authStore.removeToken();
      // Optionnel : rediriger vers la page de login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);