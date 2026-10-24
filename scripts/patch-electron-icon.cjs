const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Patches node_modules/electron so that during local development (npm run dev),
 * the macOS Dock and Notification Center display SubSync Studio's icon and name
 * instead of the generic Electron icon.
 */
function patchElectronIcon() {
  if (process.platform !== 'darwin') return;

  const electronAppPath = path.resolve(__dirname, '../node_modules/electron/dist/Electron.app');
  const icnsSource = path.resolve(__dirname, '../public/icon.icns');
  const icnsTarget = path.join(electronAppPath, 'Contents/Resources/electron.icns');
  const plistPath = path.join(electronAppPath, 'Contents/Info.plist');

  if (!fs.existsSync(electronAppPath) || !fs.existsSync(icnsSource)) {
    return;
  }

  try {
    // 1. Copy icon.icns to electron.icns
    fs.copyFileSync(icnsSource, icnsTarget);

    // 2. Patch Info.plist DisplayName and Name
    if (fs.existsSync(plistPath)) {
      execSync(`/usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName 'SubSync Studio'" "${plistPath}"`, { stdio: 'ignore' });
      execSync(`/usr/libexec/PlistBuddy -c "Set :CFBundleName 'SubSync Studio'" "${plistPath}"`, { stdio: 'ignore' });
    }

    // 3. Touch Electron.app to refresh macOS LaunchServices icon cache
    execSync(`touch "${electronAppPath}"`, { stdio: 'ignore' });

    console.log('✓ Patched Electron dev binary with SubSync Studio icon and branding.');
  } catch (err) {
    console.warn('Warning: Could not patch Electron dev icon:', err.message);
  }
}

patchElectronIcon();
