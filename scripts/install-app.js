#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const platform = os.platform();
const projectDir = path.resolve(__dirname, '..');
const projectName = 'XMRig Web UI';
const executableName = 'xmrig-web-ui';

function detectPlatform() {
  switch (platform) {
    case 'darwin':
      return 'macos';
    case 'linux':
      return 'linux';
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

function installMacOS() {
  const appDir = path.join(os.homedir(), 'Applications', `${projectName}.app`);
  const contentsDir = path.join(appDir, 'Contents');
  const macOSDir = path.join(contentsDir, 'MacOS');
  const resourcesDir = path.join(contentsDir, 'Resources');

  // Create app bundle structure
  fs.mkdirSync(macOSDir, { recursive: true });
  fs.mkdirSync(resourcesDir, { recursive: true });

  // Create Info.plist
  const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>xmrig-ui-launcher</string>
    <key>CFBundleIdentifier</key>
    <string>com.xmrig.webui</string>
    <key>CFBundleName</key>
    <string>${projectName}</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.14</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>`;

  fs.writeFileSync(path.join(contentsDir, 'Info.plist'), infoPlist);

  // Create launcher script
  const launcherScript = `#!/bin/bash
cd "${projectDir}"
# Use the CLI to start the application
"${path.join(projectDir, 'bin/xmrig-ui')}" start --daemon
sleep 2
open "http://localhost:4173"
`;

  const launcherPath = path.join(macOSDir, 'xmrig-ui-launcher');
  fs.writeFileSync(launcherPath, launcherScript);
  fs.chmodSync(launcherPath, '755');

  console.log(`✅ macOS app bundle created: ${appDir}`);
  console.log('🍎 The app will appear in your Applications folder');
}

function installLinux() {
  const desktopDir = path.join(os.homedir(), '.local', 'share', 'applications');
  fs.mkdirSync(desktopDir, { recursive: true });

  const desktopEntry = `[Desktop Entry]
Version=1.0
Type=Application
Name=${projectName}
Comment=XMRig Web UI monitoring dashboard
Exec=${path.join(projectDir, 'bin/xmrig-ui')} start --daemon && sleep 2 && xdg-open "http://localhost:4173"
Icon=utilities-system-monitor
Terminal=false
Categories=System;Monitor;
`;

  const desktopFile = path.join(desktopDir, 'xmrig-web-ui.desktop');
  fs.writeFileSync(desktopFile, desktopEntry);
  fs.chmodSync(desktopFile, '755');

  try {
    execSync('update-desktop-database ~/.local/share/applications/', { stdio: 'ignore' });
  } catch (error) {
    // Desktop database update failed, but desktop entry should still work
  }

  console.log(`✅ Linux desktop entry created: ${desktopFile}`);
  console.log('🐧 The app will appear in your applications menu');
}

async function installApp(globalOpts = {}) {
  const platform = detectPlatform();
  
  console.log(`🚀 Installing ${projectName} for ${platform}...`);
  
  try {
    switch (platform) {
      case 'macos':
        installMacOS();
        break;
      case 'linux':
        installLinux();
        break;
    }
    
    console.log(`\n✅ Installation completed successfully!`);
    console.log('💡 You can now launch the app from your applications menu or folder');
  } catch (error) {
    console.error(`❌ Installation failed: ${error.message}`);
    if (globalOpts.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Export for CLI usage
module.exports = { installApp };

// If called directly, run the install
if (require.main === module) {
  installApp();
}
  fs.mkdirSync(macOSDir, { recursive: true });
  fs.mkdirSync(resourcesDir, { recursive: true });

  // Create Info.plist
  const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>${executableName}</string>
    <key>CFBundleIdentifier</key>
    <string>com.xmrig.webui</string>
    <key>CFBundleName</key>
    <string>${projectName}</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
</dict>
</plist>`;

  fs.writeFileSync(path.join(contentsDir, 'Info.plist'), infoPlist);

  // Create executable script
  const executableScript = `#!/bin/bash
cd "${projectDir}"
npm run start-daemon
open http://localhost:4173
`;

  fs.writeFileSync(path.join(macOSDir, executableName), executableScript);
  fs.chmodSync(path.join(macOSDir, executableName), '755');

  console.log(`✅ App installed to: ${appDir}`);
  console.log('You can now find "XMRig Web UI" in your Applications folder');
}

function installLinux() {
  const desktopFile = `[Desktop Entry]
Name=${projectName}
Comment=XMRig mining dashboard
Exec=${projectDir}/scripts/start-daemon.js
Icon=${projectDir}/scripts/icon.png
Terminal=false
Type=Application
Categories=Utility;Development;
StartupNotify=true
`;

  const desktopDir = path.join(os.homedir(), '.local', 'share', 'applications');
  fs.mkdirSync(desktopDir, { recursive: true });

  const desktopFilePath = path.join(desktopDir, 'xmrig-web-ui.desktop');
  fs.writeFileSync(desktopFilePath, desktopFile);
  fs.chmodSync(desktopFilePath, '755');

  // Update desktop database
  try {
    execSync('update-desktop-database ~/.local/share/applications/', { stdio: 'ignore' });
  } catch (e) {
    // Ignore if update-desktop-database is not available
  }

  console.log(`✅ Desktop entry installed to: ${desktopFilePath}`);
  console.log('You can now find "XMRig Web UI" in your applications menu');
}

function createIcon() {
  // Create a simple SVG icon and convert to PNG if possible
  const iconSvg = `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" fill="#FF6600"/>
  <text x="32" y="40" text-anchor="middle" fill="white" font-family="Arial" font-size="20" font-weight="bold">XMR</text>
</svg>`;

  fs.writeFileSync(path.join(__dirname, 'icon.svg'), iconSvg);
  
  // Try to convert to PNG if ImageMagick is available
  try {
    execSync(`convert "${path.join(__dirname, 'icon.svg')}" "${path.join(__dirname, 'icon.png')}"`, { stdio: 'ignore' });
    console.log('✅ Icon created');
  } catch (e) {
    console.log('ℹ️  SVG icon created (install ImageMagick to generate PNG)');
  }
}

function main() {
  try {
    const platform = detectPlatform();
    
    console.log(`🔧 Installing ${projectName} for ${platform}...`);
    
    // Ensure the project is built
    console.log('📦 Building project...');
    execSync('npm run build', { cwd: projectDir, stdio: 'inherit' });
    
    // Create icon
    createIcon();
    
    // Install based on platform
    if (platform === 'macos') {
      installMacOS();
    } else if (platform === 'linux') {
      installLinux();
    }
    
    console.log('🎉 Installation complete!');
    console.log('');
    console.log('To start the daemon: npm run start-daemon');
    console.log('To stop the daemon: npm run stop-daemon');
    console.log('To check status: npm run status-daemon');
    
  } catch (error) {
    console.error('❌ Installation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}