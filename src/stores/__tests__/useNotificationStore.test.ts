import { describe, it, expect, beforeEach } from 'vitest';
import { useNotificationStore } from '../useNotificationStore';

describe('Zustand Store - useNotificationStore', () => {
  beforeEach(() => {
    useNotificationStore.setState({
      notifications: [],
      toasts: [],
      isOpen: false,
    });
  });

  it('adds notifications and creates active toasts', () => {
    const { addNotification } = useNotificationStore.getState();
    addNotification('success', 'File Saved', 'test.srt has been exported');

    const state = useNotificationStore.getState();
    expect(state.notifications.length).toBe(1);
    expect(state.notifications[0].title).toBe('File Saved');
    expect(state.notifications[0].read).toBe(false);
    expect(state.toasts.length).toBe(1);
  });

  it('removes specific toast by id', () => {
    const { addNotification, removeToast } = useNotificationStore.getState();
    addNotification('info', 'Notice 1', 'Message 1');
    addNotification('info', 'Notice 2', 'Message 2');

    const toastId = useNotificationStore.getState().toasts[0].id;
    removeToast(toastId);

    expect(useNotificationStore.getState().toasts.length).toBe(1);
  });

  it('marks notifications as read and clears history', () => {
    const { addNotification, markAsRead, markAllAsRead, clearAll } = useNotificationStore.getState();
    addNotification('warning', 'Warn 1', 'Msg 1');
    addNotification('error', 'Err 2', 'Msg 2');

    const notifId = useNotificationStore.getState().notifications[1].id;
    markAsRead(notifId);
    expect(useNotificationStore.getState().notifications.find((n) => n.id === notifId)?.read).toBe(true);

    markAllAsRead();
    expect(useNotificationStore.getState().notifications.every((n) => n.read)).toBe(true);

    clearAll();
    expect(useNotificationStore.getState().notifications).toEqual([]);
  });

  it('toggles drawer open state', () => {
    const { toggleOpen, setIsOpen } = useNotificationStore.getState();
    expect(useNotificationStore.getState().isOpen).toBe(false);

    toggleOpen();
    expect(useNotificationStore.getState().isOpen).toBe(true);

    setIsOpen(false);
    expect(useNotificationStore.getState().isOpen).toBe(false);
  });
});
