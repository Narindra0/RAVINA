import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/axios';
import { authStore } from '../store/auth';

const POLLING_INTERVAL_MS = 60000;

export function useNotifications({
  polling = true,
  unreadOnly = true,
  enabled = true,
} = {}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pollingRef = useRef(null);
  const mountedRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (!enabled || !authStore.isAuthenticated()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = {
        'order[dateCreation]': 'desc',
      };
      if (unreadOnly) {
        params.statutLecture = false;
      }

      const response = await api.get('/notifications', { params });
      const payload = response.data;
      const list = Array.isArray(payload)
        ? payload
        : payload?.['hydra:member'] ?? payload?.member ?? [];

      if (mountedRef.current) {
        setNotifications(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
      }
      console.error('Erreur lors du chargement des notifications:', err);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [enabled, unreadOnly]);

  const markAsRead = useCallback(async (notificationId) => {
    if (!notificationId) return;

    try {
      await api.patch(
        `/notifications/${notificationId}`,
        { statutLecture: true },
        {
          headers: {
            'Content-Type': 'application/merge-patch+json',
          },
        }
      );

      if (!mountedRef.current) {
        return;
      }

      setNotifications((prev) => {
        if (unreadOnly) {
          return prev.filter((item) => item.id !== notificationId);
        }

        return prev.map((item) =>
          item.id === notificationId ? { ...item, statutLecture: true } : item
        );
      });
    } catch (err) {
      console.error('Impossible de marquer la notification comme lue:', err);
      throw err;
    }
  }, [unreadOnly]);

  useEffect(() => {
    mountedRef.current = true;
    fetchNotifications();

    if (polling) {
      pollingRef.current = setInterval(fetchNotifications, POLLING_INTERVAL_MS);
    }

    return () => {
      mountedRef.current = false;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [fetchNotifications, polling]);

  const unreadCount = useMemo(() => {
    if (unreadOnly) {
      return notifications.length;
    }
    return notifications.filter((item) => item?.statutLecture === false).length;
  }, [notifications, unreadOnly]);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    refresh: fetchNotifications,
    markAsRead,
    setNotifications,
  };
}

