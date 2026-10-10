import { app, ipcMain, nativeImage, Notification, shell } from 'electron';
import fsSync from 'node:fs';
import { execFile } from 'node:child_process';

/**
 * Options to initialize the cross-platform notification manager.
 */
export interface NotificationManagerConfig {
  /** The human-readable application name (e.g. 'SubSync Studio') */
  appName: string;
  /** Unique App ID / Bundle ID (e.g. 'com.subsync.studio' or Windows AUMID) */
  appId: string;
  /** Absolute or relative path to the notification icon (PNG/ICO) */
  defaultIconPath?: string;
  /** Whether to log diagnostic notification messages in development */
  debug?: boolean;
}

/**
 * Payload options for dispatching a notification.
 */
export interface NotificationPayload {
  title: string;
  message: string;
  sound?: boolean;
  iconPath?: string;
  urgency?: 'normal' | 'critical' | 'low';
}

/**
 * Reusable, Universal Notification Manager for Electron applications.
 *
 * Handles all OS-specific nuances:
 * - macOS: Prevents silent drops (bypasses dev-mode unsigned binary restrictions with AppleScript fallback),
 *   omits icon in new Notification (macOS uses app bundle icon).
 * - Windows: Sets AppUserModelId (AUMID) required for Action Center banners.
 * - Linux: Passes nativeImage and urgency headers.
 * - System Settings: Provides IPC method to deep-link directly into OS notification preferences.
 */
export class NotificationManager {
  private static instance: NotificationManager | null = null;
  private config: NotificationManagerConfig;

  private constructor(config: NotificationManagerConfig) {
    this.config = config;
    this.initPlatformIdentity();
    this.registerIpcHandlers();
  }

  /**
   * Initialize or retrieve the global notification manager instance.
   */
  public static init(config: NotificationManagerConfig): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager(config);
    } else {
      NotificationManager.instance.config = { ...NotificationManager.instance.config, ...config };
    }
    return NotificationManager.instance;
  }

  public static getInstance(): NotificationManager | null {
    return NotificationManager.instance;
  }

  /**
   * Configure application identity for Windows and macOS.
   */
  private initPlatformIdentity(): void {
    app.setName(this.config.appName);

    if (process.platform === 'win32') {
      app.setAppUserModelId(this.config.appId);
    }
  }

  /**
   * Register standard IPC channels for the Renderer process.
   */
  private registerIpcHandlers(): void {
    // 1. Show notification channel
    ipcMain.handle('notification:show', (_, payload: NotificationPayload) => {
      return this.show(payload);
    });

    // 2. Open OS Notification Settings channel
    ipcMain.handle('settings:openNotifications', async () => {
      return this.openSystemSettings();
    });

    // 3. Query OS support
    ipcMain.handle('notification:isSupported', () => {
      return Notification.isSupported();
    });
  }

  /**
   * Display a native notification across macOS, Windows, and Linux.
   */
  public show(payload: NotificationPayload): boolean {
    const { title, message, sound = true, iconPath, urgency = 'normal' } = payload;
    const resolvedTitle = title || this.config.appName;
    const resolvedMessage = message || '';

    // Resolve icon path
    const targetIconPath = iconPath || this.config.defaultIconPath;
    let iconObj: Electron.NativeImage | undefined;
    if (targetIconPath && fsSync.existsSync(targetIconPath)) {
      iconObj = nativeImage.createFromPath(targetIconPath);
    }

    let electronNotificationShown = false;

    // 1. Attempt Electron Native Notification API
    if (Notification.isSupported()) {
      try {
        const notifOptions: Electron.NotificationConstructorOptions = {
          title: resolvedTitle,
          body: resolvedMessage,
          silent: !sound,
          urgency,
          // NOTE: On macOS, passing icon to new Notification causes it to be ignored
          // or silently dropped because macOS uses the application bundle icon.
          icon: process.platform !== 'darwin' ? iconObj : undefined,
        };

        const notification = new Notification(notifOptions);
        notification.show();
        electronNotificationShown = true;

        if (this.config.debug) {
          console.log(`[NotificationManager] Dispatched native Notification: "${resolvedTitle}"`);
        }
      } catch (err) {
        console.warn('[NotificationManager] Native notification error:', err);
      }
    }

    // 2. Guaranteed macOS Desktop Banner via AppleScript (osascript)
    // In macOS development mode (or when running an unsigned Electron binary),
    // macOS Notification Center suppresses banners for the unsigned bundle.
    // osascript guarantees a real native banner with chime sound on macOS.
    if (process.platform === 'darwin') {
      try {
        const cleanMsg = resolvedMessage.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const cleanTitle = resolvedTitle.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const soundClause = sound ? ' sound name "default"' : '';
        const script = `display notification "${cleanMsg}" with title "${cleanTitle}"${soundClause}`;

        execFile('osascript', ['-e', script], (err) => {
          if (err && this.config.debug) {
            console.warn('[NotificationManager] osascript fallback warning:', err);
          }
        });
      } catch (err) {
        console.warn('[NotificationManager] Failed to dispatch macOS osascript notification:', err);
      }
    }

    return electronNotificationShown;
  }

  /**
   * Open the native OS Notification Settings window.
   * Directs user to macOS System Settings or Windows Notification Settings.
   */
  public async openSystemSettings(): Promise<boolean> {
    try {
      if (process.platform === 'darwin') {
        await shell.openExternal('x-apple.systempreferences:com.apple.preference.notifications');
      } else if (process.platform === 'win32') {
        await shell.openExternal('ms-settings:notifications');
      } else {
        // Linux generic settings (GNOME / KDE)
        await shell.openExternal('gnome-control-center://notifications');
      }
      return true;
    } catch (e) {
      console.warn('[NotificationManager] Failed to open system notification settings:', e);
      return false;
    }
  }
}

/**
 * Convenience helper to set up the notification manager with one function call.
 */
export function setupNotifications(config: NotificationManagerConfig): NotificationManager {
  return NotificationManager.init(config);
}

/**
 * Convenience helper to show a notification directly using the singleton instance.
 */
export function showNativeNotification(title: string, message: string, sound = true): boolean {
  const manager = NotificationManager.getInstance();
  if (manager) {
    return manager.show({ title, message, sound });
  }
  return false;
}
