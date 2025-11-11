import axios from 'axios'
import { authStore } from '../store/auth'

// Configuration de l'URL de base de l'API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ravina-production.up.railway.app/index.php'

// Création de l'instance axios
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // Timeout de 10 secondes
})

// Intercepteur pour les requêtes sortantes
api.interceptors.request.use(
  (config) => {
    const token = authStore.getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Intercepteur pour les réponses
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Gestion des erreurs d'authentification
    if (error.response?.status === 401) {
      authStore.clearToken()
      // Rediriger vers la page de connexion si nécessaire
      // window.location.href = '/login'
    }
    
    // Gestion des erreurs serveur
    if (error.response?.status >= 500) {
      console.error('Erreur serveur:', error.response.data)
    }
    
    return Promise.reject(error)
  }
)
