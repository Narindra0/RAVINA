import axios from 'axios'
import { authStore } from '../store/auth'

// ATTENTION: C'est l'URL en DUR. Cela résout le problème du 'undefined'.
const API_BASE_URL = "https://ravina-production.up.railway.app/index.php";

export const api = axios.create({
  // L'URL de production est directement ici
  baseURL: `${API_BASE_URL}/api`, 
})

api.interceptors.request.use((config) => {
  const token = authStore.getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
