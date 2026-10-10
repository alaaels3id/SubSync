import { app, Notification } from 'electron';
import notifier from 'node-notifier';
import path from 'node:path';

app.whenReady().then(() => {
  console.log('Testing notification on macOS with custom icon...');

  const iconPath = path.resolve('public/icon.png');

  if (Notification.isSupported()) {
    try {
      const notification = new Notification({
        title: 'SubSync Studio',
        body: 'هذا إشعار تجريبي بشعار التطبيق المخصص',
        icon: iconPath,
        silent: false
      });
      notification.show();
    } catch (e) {
      console.warn('Native notification failed:', e);
    }
  }

  if (process.platform === 'darwin') {
    notifier.notify(
      {
        title: 'SubSync Studio',
        message: 'هذا إشعار تجريبي بشعار التطبيق المخصص 🎬',
        icon: iconPath,
        contentImage: iconPath,
        sound: true,
        wait: false
      },
      (err) => {
        if (err) console.error('Notifier error:', err);
      }
    );
  }

  setTimeout(() => {
    console.log('Test notification sent successfully!');
    app.quit();
  }, 1000);
});
