/**
 * Reusable Frontend Client for Electron Desktop & Push Notifications.
 *
 * Can be dropped into any React, Vue, or TypeScript web frontend.
 */

export interface DesktopNotificationOptions {
  title: string;
  message: string;
  sound?: boolean;
  iconPath?: string;
  urgency?: 'normal' | 'critical' | 'low';
}

/**
 * Check the current Notification permission state.
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    return Notification.permission;
  }
  return 'denied';
}

/**
 * Request OS system permission to display notifications.
 * On macOS / Windows, triggers the system dialog for user consent.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'default') {
      try {
        const result = await Notification.requestPermission();
        return result;
      } catch (err) {
        console.warn('[NotificationClient] requestPermission error:', err);
      }
    }
    return Notification.permission;
  }
  return 'denied';
}

/**
 * Show a desktop notification using both the Web Notification API and the Electron Main IPC channel.
 */
export async function showDesktopNotification(options: DesktopNotificationOptions): Promise<void> {
  const { title, message, sound = true, iconPath, urgency = 'normal' } = options;

  // 1. Ensure permission is requested if still default
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch {}
    }

    // 2. Dispatch via HTML5 Web Notification API if granted
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          silent: !sound,
        });
      } catch (e) {
        // Fallback to Electron IPC below
      }
    }
  }

  // 3. Dispatch via Electron Main Process (guarantees display on macOS/Windows even in background)
  if (typeof window !== 'undefined' && window.electronAPI?.showNotification) {
    try {
      await window.electronAPI.showNotification({
        title,
        message,
        sound,
        iconPath,
        urgency,
      });
    } catch (err) {
      console.warn('[NotificationClient] Electron IPC notification error:', err);
    }
  }
}

/**
 * Deep-link directly to macOS or Windows Notification Settings.
 */
export async function openSystemNotificationSettings(): Promise<boolean> {
  if (typeof window !== 'undefined' && window.electronAPI?.openSystemNotificationSettings) {
    try {
      return await window.electronAPI.openSystemNotificationSettings();
    } catch (err) {
      console.warn('[NotificationClient] openSystemNotificationSettings error:', err);
    }
  }
  return false;
}
