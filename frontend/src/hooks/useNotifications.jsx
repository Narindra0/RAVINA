import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/axios';

const POLLING_INTERVAL_MS = 60000;

export function useNotifications({ polling = true } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pollingRef = useRef(null);
  const mountedRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/notifications', {
        params: {
          statutLecture: false,
          order: { dateCreation: 'desc' },
        },
      });

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
  }, []);

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

      if (mountedRef.current) {
        setNotifications((prev) => prev.filter((item) => item.id !== notificationId));
      }
    } catch (err) {
      console.error('Impossible de marquer la notification comme lue:', err);
      throw err;
    }
  }, []);

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

  return {
    notifications,
    loading,
    error,
    refresh: fetchNotifications,
    markAsRead,
  };
}

