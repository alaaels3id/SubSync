# Universal Electron Desktop & Push Notifications Guide

This guide provides a plug-and-play, reusable configuration for handling desktop push notifications across **macOS**, **Windows**, and **Linux** in any Electron project.

---

## 🛑 Common Notification Pitfalls in Electron

1. **macOS Development Mode (Unsigned Binaries)**:
   - In dev mode (`npm run dev`), Electron runs an unsigned binary (`Electron.app`).
   - macOS Notification Center suppresses notification banners for unsigned apps.
   - **Solution**: The `NotificationManager` provides an automatic AppleScript (`osascript`) fallback that guarantees banners and chime sounds on macOS.
2. **Missing System Permissions**:
   - macOS requires explicit permission from the user before showing notifications. If `Notification.requestPermission()` is never invoked, notifications are silently dropped.
   - **Solution**: The `notificationClient` checks permission and invokes `Notification.requestPermission()` before dispatching.
3. **The macOS `icon` Option Bug**:
   - Passing `icon` to `new Notification({ icon })` on macOS causes notifications to be dropped or ignored. macOS requires icons to come from the application bundle.
   - **Solution**: The manager strips the `icon` argument on macOS while keeping it active for Windows & Linux.
4. **Windows Action Center (AUMID)**:
   - Windows requires an `AppUserModelId` to show banners in Action Center.
   - **Solution**: `app.setAppUserModelId(appId)` is automatically called during initialization.

---

## 📁 Files Included

| File | Process | Purpose |
| :--- | :--- | :--- |
| [`electron/notifications/notificationManager.ts`](file:///Users/alaaelsaid/work/electron/SubSync/electron/notifications/notificationManager.ts) | **Main** | Universal cross-platform notification dispatcher & IPC handlers. |
| [`src/utils/notificationClient.ts`](file:///Users/alaaelsaid/work/electron/SubSync/src/utils/notificationClient.ts) | **Renderer** | Frontend utility to request permissions, show notifications, and open system settings. |

---

## 🚀 How to Use in Any Electron Project (3-Step Setup)

### Step 1: Main Process (`electron/main.ts`)

Import `setupNotifications` and call it when initializing the app:

```typescript
import { app } from 'electron';
import path from 'node:path';
import { setupNotifications } from './notifications/notificationManager';

// Initialize Notification Manager
const notificationManager = setupNotifications({
  appName: 'Your App Name',
  appId: 'com.yourcompany.yourapp',
  defaultIconPath: path.resolve('public/icon.png'),
  debug: !app.isPackaged,
});

app.whenReady().then(() => {
  // your window creation...
});
```

### Step 2: Preload Script (`electron/preload.ts`)

Expose the notification API to the renderer:

```typescript
import { contextBridge, ipcRenderer } from 'electron';

const api = {
  showNotification: (options: {
    title: string;
    message: string;
    sound?: boolean;
    iconPath?: string;
  }) => ipcRenderer.invoke('notification:show', options),

  openSystemNotificationSettings: () =>
    ipcRenderer.invoke('settings:openNotifications'),
};

contextBridge.exposeInMainWorld('electronAPI', api);
```

### Step 3: Renderer / Frontend (`React / Vue / Svelte / Plain JS`)

Use `showDesktopNotification` and `requestNotificationPermission`:

```typescript
import {
  showDesktopNotification,
  requestNotificationPermission,
  openSystemNotificationSettings,
  getNotificationPermission
} from '@/utils/notificationClient';

// 1. Request Permission (e.g. on user click or app launch)
await requestNotificationPermission();

// 2. Dispatch a Notification
await showDesktopNotification({
  title: 'Render Complete! 🎬',
  message: 'Your video has finished exporting successfully.',
  sound: true,
});

// 3. Open OS System Settings if blocked
await openSystemNotificationSettings();
```

---

## 🛠️ API Reference

### `NotificationManagerConfig` (Main Process)
- `appName: string` - Application display name.
- `appId: string` - Bundle ID (macOS) / AppUserModelId (Windows).
- `defaultIconPath?: string` - Path to fallback notification icon (PNG/ICO).
- `debug?: boolean` - Logs diagnostic messages.

### `DesktopNotificationOptions` (Renderer Process)
- `title: string` - Notification header.
- `message: string` - Notification body text.
- `sound?: boolean` - Play OS chime (default: `true`).
- `iconPath?: string` - Custom icon path (Windows/Linux).
- `urgency?: 'normal' | 'critical' | 'low'` - Priority level.
