import axios from 'axios'
import { authStore } from '../store/auth'

// 1. Utilisez la variable d'environnement configurée sur Vercel
//    Note : Assurez-vous que Vercel est bien réglé sur :
//    NEXT_PUBLIC_API_URL = https://ravina-production.up.railway.app/index.php
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
  // 2. Combinez l'URL de base avec le chemin '/api'
  baseURL: `${API_BASE_URL}/api`,
})

api.interceptors.request.use((config) => {
  const token = authStore.getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
