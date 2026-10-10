import { create } from 'zustand';

export type NotificationType = 'success' | 'info' | 'warning' | 'error' | 'test';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

interface NotificationState {
  notifications: AppNotification[];
  toasts: AppNotification[];
  isOpen: boolean;

  addNotification: (type: NotificationType, title: string, message: string) => void;
  removeToast: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  setIsOpen: (open: boolean) => void;
  toggleOpen: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [
    {
      id: 'notif-welcome',
      type: 'info',
      title: 'مرحبًا بك في SubSync Studio',
      message: 'تم تجهيز مساحة العمل بنجاح. يمكنك استيراد فيديو أو البدء بمشروع جديد.',
      timestamp: Date.now(),
      read: false,
    },
  ],
  toasts: [],
  isOpen: false,

  addNotification: (type, title, message) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      title,
      message,
      timestamp: Date.now(),
      read: false,
    };

    set((state) => ({
      notifications: [newNotif, ...state.notifications],
      toasts: [...state.toasts, newNotif],
    }));

    // Auto dismiss toast after 4.5 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== newNotif.id),
      }));
    }, 4500);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  clearAll: () => set({ notifications: [] }),

  setIsOpen: (isOpen) => set({ isOpen }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
}));
