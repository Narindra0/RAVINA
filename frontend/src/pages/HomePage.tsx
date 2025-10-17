// src/pages/HomePage.tsx
export default function HomePage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold">Bienvenue</h1>
      <a href="/login" className="text-blue-500 underline">
        Se connecter
      </a>
    </div>
  );
}

// src/pages/LoginPage.tsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { apiClient } from '../lib/apiClient';
import { authStore, type LoginCredentials, type AuthResponse } from '../stores/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiClient.post<AuthResponse>('/login', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      authStore.setToken(data.token);
      navigate({ to: '/dashboard' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-3xl font-bold mb-4">Connexion</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loginMutation.isPending ? 'Connexion...' : 'Se connecter'}
        </button>
        {loginMutation.isError && (
          <p className="text-red-500">Erreur de connexion</p>
        )}
      </form>
    </div>
  );
}

// src/pages/DashboardPage.tsx
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { authStore } from '../stores/authStore';
import { useNavigate } from '@tanstack/react-router';

export default function DashboardPage() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await apiClient.get('/user/me');
      return response.data;
    },
  });

  const handleLogout = () => {
    authStore.removeToken();
    navigate({ to: '/login' });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      {user && (
        <div>
          <p>Email: {user.email}</p>
          <p>Rôles: {user.roles.join(', ')}</p>
        </div>
      )}
      <button
        onClick={handleLogout}
        className="mt-4 bg-red-500 text-white p-2 rounded hover:bg-red-600"
      >
        Déconnexion
      </button>
    </div>
  );
}