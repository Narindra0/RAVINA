// src/router.tsx
import { createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { authStore } from './stores/authStore';

// Pages (à créer ensuite)
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

// Root route
const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
    </>
  ),
});

// Routes publiques
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

// Routes protégées
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardPage,
  beforeLoad: () => {
    // Vérifier l'authentification
    if (!authStore.isAuthenticated()) {
      throw new Error('Unauthorized');
    }
  },
});

// Tree de routes
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  dashboardRoute,
]);

// Créer le router
export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});