"use client";

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api-client';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  referenceType?: string;
  referenceId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: (unreadOnly?: boolean) => Promise<void>;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  requestPushPermission: () => Promise<boolean>;
  subscribeToPush: () => Promise<boolean>;
  isPushSupported: boolean;
  isPushEnabled: boolean;
  pushError: string | null;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);

  // Check if push is supported (requires HTTPS and service worker)
  const isPushSupported = typeof window !== 'undefined' && 
    window.location.protocol === 'https:' &&
    'serviceWorker' in navigator && 
    'PushManager' in window;

  const fetchNotifications = useCallback(async (unreadOnly = false) => {
    try {
      setIsLoading(true);
      const response = await apiFetch(`/api/notifications?unreadOnly=${unreadOnly}&limit=20`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      const response = await apiFetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          notificationIds.includes(n.id) 
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await apiFetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark all as read');
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, []);

  const requestPushPermission = useCallback(async (): Promise<boolean> => {
    if (!isPushSupported) {
      setPushError('Notificações push não são suportadas neste navegador ou requerem HTTPS');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        return true;
      } else if (permission === 'denied') {
        setPushError('Permissão de notificação negada. Habilite nas configurações do navegador.');
      }
      return false;
    } catch (err) {
      console.error('Error requesting push permission:', err);
      setPushError('Erro ao solicitar permissão de notificação');
      return false;
    }
  }, [isPushSupported]);

  const subscribeToPush = useCallback(async (): Promise<boolean> => {
    if (!isPushSupported) {
      setPushError('Notificações push não são suportadas');
      return false;
    }

    setPushError(null);

    try {
      // First check if VAPID keys are configured
      const vapidResponse = await fetch('/api/push/subscribe');
      const vapidData = await vapidResponse.json();
      
      if (!vapidData.publicKey) {
        setPushError('Notificações push não estão configuradas no servidor');
        return false;
      }

      // Request permission first
      const permissionGranted = await requestPushPermission();
      if (!permissionGranted) {
        return false;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.ready;
      
      // Get push subscription
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidData.publicKey) as BufferSource,
        });
      }

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      if (response.ok) {
        setIsPushEnabled(true);
        return true;
      } else {
        setPushError('Erro ao registrar notificação no servidor');
        return false;
      }
    } catch (err) {
      console.error('Error subscribing to push:', err);
      setPushError('Erro ao ativar notificações push. Tente novamente.');
      return false;
    }
  }, [isPushSupported, requestPushPermission]);

  // Helper function to convert VAPID key
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Check push status on mount
  useEffect(() => {
    const checkPushStatus = async () => {
      if (!isPushSupported) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsPushEnabled(!!subscription);
      } catch (err) {
        console.error('Error checking push status:', err);
      }
    };

    checkPushStatus();
  }, [isPushSupported]);

  // Register service worker
  useEffect(() => {
    if (!isPushSupported) return;

    const registerServiceWorker = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered');
      } catch (err) {
        console.error('Service Worker registration failed:', err);
      }
    };

    registerServiceWorker();
  }, [isPushSupported]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    requestPushPermission,
    subscribeToPush,
    isPushSupported,
    isPushEnabled,
    pushError,
  };
}
