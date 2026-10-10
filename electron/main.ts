import { app, BrowserWindow, ipcMain, dialog, protocol, net, nativeImage, Notification } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Register custom protocol for local video streaming with range request support
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media-loader',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
      bypassCSP: true,
    },
  },
]);

let mainWindow: BrowserWindow | null = null;

// The built directory structure
process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public');

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

function createWindow() {
  const preloadPath = fsSync.existsSync(path.join(__dirname, 'preload.mjs'))
    ? path.join(__dirname, 'preload.mjs')
    : path.join(__dirname, 'preload.js');

  const publicDir = process.env.VITE_PUBLIC || path.join(__dirname, '../public');
  const iconPath = path.join(publicDir, process.platform === 'win32' ? 'icon.ico' : 'icon.png');

  mainWindow = new BrowserWindow({
    title: 'SubSync Studio',
    icon: fsSync.existsSync(iconPath) ? iconPath : undefined,
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#111D4A', // Space Indigo
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Test active push message to Renderer-process.
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send('main-process-message', (new Date()).toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(process.env.DIST || path.join(__dirname, '../dist'), 'index.html'));
  }
}

/**
 * Display native desktop notification using Electron's Notification API
 * with the custom app icon and sound.
 */
export function showNativeNotification(title: string, message: string, sound = true) {
  const publicDir = process.env.VITE_PUBLIC || path.join(__dirname, '../public');
  const iconPath = path.resolve(publicDir, 'icon.png');
  const icon = fsSync.existsSync(iconPath) ? nativeImage.createFromPath(iconPath) : undefined;

  if (Notification.isSupported()) {
    try {
      const notification = new Notification({
        title,
        body: message,
        icon,
        silent: !sound,
      });
      notification.show();
    } catch (e) {
      console.warn('Native notification error:', e);
    }
  }
}

// App lifecycle
app.whenReady().then(() => {
  // Register media-loader handler to safely stream local video files to HTML5 video tag
  protocol.handle('media-loader', (request) => {
    try {
      const decodedUrl = decodeURIComponent(request.url);
      const filePath = decodedUrl.replace('media-loader://', '');
      return net.fetch(pathToFileURL(filePath).toString(), { bypassCustomProtocolHandlers: true });
    } catch (err) {
      console.error('Failed to stream media file:', err);
      return new Response('Media file not found or inaccessible', { status: 404 });
    }
  });

  // Native Open Video Dialog
  ipcMain.handle('dialog:openVideo', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'اختر ملف الفيديو (Select Video File)',
      properties: ['openFile'],
      filters: [
        { name: 'Video Files', extensions: ['mp4', 'mkv', 'webm', 'mov', 'avi'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const filePath = result.filePaths[0];
    const stats = await fs.stat(filePath);
    const fileName = path.basename(filePath);

    return {
      filePath,
      fileName,
      size: stats.size,
      mediaUrl: `media-loader://${encodeURIComponent(filePath)}`,
    };
  });

  // Native Open SRT Dialog
  ipcMain.handle('dialog:openSrt', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'استيراد ملف ترجمة (Import Subtitle)',
      properties: ['openFile'],
      filters: [
        { name: 'SubRip Subtitle', extensions: ['srt'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const filePath = result.filePaths[0];
    const content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath);

    return {
      filePath,
      fileName,
      content,
    };
  });

  // Native Save SRT Dialog
  ipcMain.handle('dialog:saveSrt', async (_, { content, defaultName }: { content: string; defaultName?: string }) => {
    if (!mainWindow) return { success: false };
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'تصدير ملف الترجمة (Export Subtitle)',
      defaultPath: defaultName || 'subtitles.srt',
      filters: [{ name: 'SubRip Subtitle', extensions: ['srt'] }],
    });

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }

    await fs.writeFile(result.filePath, content, 'utf-8');
    return { success: true, filePath: result.filePath };
  });

  // File system utilities
  ipcMain.handle('fs:readFile', async (_, filePath: string) => {
    return await fs.readFile(filePath, 'utf-8');
  });

  ipcMain.handle('fs:writeFile', async (_, { filePath, content }: { filePath: string; content: string }) => {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
    return true;
  });

  // App version
  ipcMain.handle('app:getVersion', () => {
    return app.getVersion();
  });

  // Native notification handler (FR-023, test-notif support)
  ipcMain.handle('notification:show', (_, { title, message, sound }: { title: string; message: string; sound?: boolean }) => {
    showNativeNotification(title, message, sound ?? true);
    return true;
  });

  // Set macOS dock icon
  if (process.platform === 'darwin' && app.dock) {
    const publicDir = process.env.VITE_PUBLIC || path.join(__dirname, '../public');
    const dockIconPath = path.join(publicDir, 'icon.png');
    if (fsSync.existsSync(dockIconPath)) {
      const img = nativeImage.createFromPath(dockIconPath);
      if (!img.isEmpty()) {
        app.dock.setIcon(img);
      }
    }
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
