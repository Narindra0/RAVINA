import axios from 'axios'
import { authStore } from '../store/auth'

// Configuration de l'URL de base de l'API
// Assurez-vous que VITE_API_URL est bien défini dans votre .env (e.g., VITE_API_URL=https://ravina-production.up.railway.app/index.php)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ravina-production.up.railway.app/index.php'

// Création de l'instance axios
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
    // CORRECTION 406 : Remplacement de 'application/id+json' par 'application/json'
    'Accept': 'application/json', 
  },
  timeout: 10000, // Timeout de 10 secondes
})

// Intercepteur pour les requêtes sortantes (Ajout du token d'authentification)
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

// Intercepteur pour les réponses (Gestion des erreurs, notamment 401 Unauthorized)
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Gestion des erreurs d'authentification
    if (error.response?.status === 401) {
      authStore.clearToken()
      // Décommentez la ligne ci-dessous si vous voulez une redirection automatique
      // window.location.href = '/login'
    }
    
    // Gestion des erreurs serveur
    if (error.response?.status >= 500) {
      console.error('Erreur serveur:', error.response.data)
    }
    
    return Promise.reject(error)
  }
)
