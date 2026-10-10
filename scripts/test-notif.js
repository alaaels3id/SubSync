import { app, Notification, nativeImage } from 'electron';
import path from 'node:path';

app.whenReady().then(() => {
  console.log('Testing notification on macOS with custom icon...');

  const iconPath = path.resolve('public/icon.png');
  const icon = nativeImage.createFromPath(iconPath);

  if (Notification.isSupported()) {
    try {
      const notification = new Notification({
        title: 'SubSync Studio',
        body: 'هذا إشعار تجريبي بشعار التطبيق المخصص 🎬',
        icon,
        silent: false,
      });
      notification.show();
      console.log('Native notification displayed!');
    } catch (e) {
      console.warn('Native notification failed:', e);
    }
  } else {
    console.warn('Desktop notifications are not supported on this system.');
  }

  setTimeout(() => {
    console.log('Test notification script finished.');
    app.quit();
  }, 1200);
});
