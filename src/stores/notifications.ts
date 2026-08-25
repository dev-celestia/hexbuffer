import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AlertType = 'info' | 'warning' | 'error' | 'success';

export interface AppAlert {
  id: string;
  title: string;
  message: string;
  type: AlertType;
  timestamp: number;
  read: boolean;
  source?: string;
}

export interface NewAlert {
  id?: string;
  title: string;
  message: string;
  type?: AlertType;
  timestamp?: number;
  read?: boolean;
  source?: string;
}

interface NotificationState {
  alerts: AppAlert[];
  addAlert: (alert: NewAlert) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeAlert: (id: string) => void;
  clearAll: () => void;
}

const INITIAL_ALERTS: AppAlert[] = [
  {
    id: 'init-proxy-idle',
    title: 'Proxy Engine Ready',
    message: 'HTTP/HTTPS interceptor engine loaded on default port 8888.',
    type: 'info',
    timestamp: Date.now() - 1000 * 60 * 2,
    read: false,
    source: 'Proxy',
  },
];

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      alerts: INITIAL_ALERTS,

      addAlert: (alert) => {
        const newAlert: AppAlert = {
          id: alert.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
          title: alert.title,
          message: alert.message,
          type: alert.type || 'info',
          timestamp: alert.timestamp || Date.now(),
          read: alert.read ?? false,
          source: alert.source,
        };

        set((state) => ({
          alerts: [newAlert, ...state.alerts.filter((a) => a.id !== newAlert.id)].slice(0, 100),
        }));
      },

      markAsRead: (id) => {
        set((state) => ({
          alerts: state.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          alerts: state.alerts.map((a) => ({ ...a, read: true })),
        }));
      },

      removeAlert: (id) => {
        set((state) => ({
          alerts: state.alerts.filter((a) => a.id !== id),
        }));
      },

      clearAll: () => {
        set({ alerts: [] });
      },
    }),
    {
      name: 'hexbuffer-notifications',
    }
  )
);
