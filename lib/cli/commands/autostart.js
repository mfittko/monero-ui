const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');
const boxen = require('boxen');

class AutostartCommand {
  static getPlatform() {
    const platform = os.platform();
    switch (platform) {
      case 'darwin': return 'macos';
      case 'linux': return 'linux';
      case 'win32': return 'windows';
      default: return 'unknown';
    }
  }

  static getServiceConfig(options = {}) {
    const platform = this.getPlatform();
    const projectDir = path.resolve(__dirname, '../../../');
    const nodePath = process.execPath;
    const scriptPath = path.join(projectDir, 'bin/xmrig-ui');
    
    const config = {
      name: 'xmrig-web-ui',
      displayName: 'XMRig Web UI',
      description: 'XMRig Web UI monitoring dashboard',
      execPath: nodePath,
      args: [scriptPath, 'start', '--daemon', '--port', options.port || '4173', '--host', options.host || '0.0.0.0'],
      workingDir: projectDir,
      user: os.userInfo().username,
      delay: parseInt(options.delay || '10')
    };

    return { platform, config };
  }

  static async enable(options, globalOpts) {
    const { platform, config } = this.getServiceConfig(options);
    
    if (platform === 'unknown') {
      throw new Error(`Autostart is not supported on platform: ${os.platform()}`);
    }

    const spinner = ora('Enabling autostart...').start();
    
    try {
      switch (platform) {
        case 'macos':
          await this.enableMacOS(config, globalOpts);
          break;
        case 'linux':
          await this.enableLinux(config, globalOpts);
          break;
        case 'windows':
          await this.enableWindows(config, globalOpts);
          break;
      }
      
      spinner.succeed('Autostart enabled successfully');
      
      if (globalOpts.json) {
        console.log(JSON.stringify({
          status: 'enabled',
          platform: platform,
          service: config.name
        }, null, 2));
      } else {
        console.log(boxen(
          chalk.green.bold('✅ Autostart Enabled\n\n') +
          chalk.white(`Service: ${chalk.cyan(config.displayName)}\n`) +
          chalk.white(`Platform: ${chalk.magenta(platform)}\n`) +
          chalk.white(`Startup delay: ${chalk.yellow(config.delay + 's')}\n\n`) +
          chalk.gray('The service will start automatically on next boot'),
          {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'green'
          }
        ));
      }
    } catch (error) {
      spinner.fail('Failed to enable autostart');
      throw error;
    }
  }

  static async disable(options, globalOpts) {
    const { platform, config } = this.getServiceConfig();
    
    if (platform === 'unknown') {
      throw new Error(`Autostart is not supported on platform: ${os.platform()}`);
    }

    const spinner = ora('Disabling autostart...').start();
    
    try {
      switch (platform) {
        case 'macos':
          await this.disableMacOS(config, globalOpts);
          break;
        case 'linux':
          await this.disableLinux(config, globalOpts);
          break;
        case 'windows':
          await this.disableWindows(config, globalOpts);
          break;
      }
      
      spinner.succeed('Autostart disabled successfully');
      
      if (globalOpts.json) {
        console.log(JSON.stringify({
          status: 'disabled',
          platform: platform
        }, null, 2));
      } else {
        console.log(chalk.green('✅ Autostart disabled'));
      }
    } catch (error) {
      spinner.fail('Failed to disable autostart');
      throw error;
    }
  }

  static async status(options, globalOpts) {
    const { platform, config } = this.getServiceConfig();
    
    if (platform === 'unknown') {
      const result = {
        status: 'unsupported',
        platform: os.platform(),
        message: 'Autostart is not supported on this platform'
      };
      
      if (globalOpts.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(chalk.yellow('⚠️'), result.message);
      }
      return;
    }

    let isEnabled = false;
    let serviceInfo = {};
    
    try {
      switch (platform) {
        case 'macos':
          isEnabled = this.checkMacOSStatus(config);
          break;
        case 'linux':
          serviceInfo = this.checkLinuxStatus(config);
          isEnabled = serviceInfo.enabled;
          break;
        case 'windows':
          isEnabled = this.checkWindowsStatus(config);
          break;
      }
    } catch (error) {
      // Service checking failed, assume not enabled
      isEnabled = false;
    }

    const status = {
      autostart: {
        enabled: isEnabled,
        platform: platform,
        service: config.name,
        ...serviceInfo
      }
    };

    if (globalOpts.json) {
      console.log(JSON.stringify(status, null, 2));
    } else {
      console.log(boxen(
        chalk.bold('Autostart Status\n\n') +
        chalk.white('Platform: ') + chalk.magenta(platform) + '\n' +
        chalk.white('Status: ') + (isEnabled ? 
          chalk.green('Enabled') : 
          chalk.red('Disabled')) + '\n' +
        chalk.white('Service: ') + chalk.cyan(config.name) + '\n' +
        (serviceInfo.type ? chalk.white('Type: ') + chalk.gray(serviceInfo.type) + '\n' : '') +
        (serviceInfo.file ? chalk.white('Config: ') + chalk.gray(serviceInfo.file) : ''),
        {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: isEnabled ? 'green' : 'yellow'
        }
      ));
    }
  }

  // macOS launchd implementation
  static async enableMacOS(config, globalOpts) {
    const plistDir = path.join(os.homedir(), 'Library', 'LaunchAgents');
    const plistFile = path.join(plistDir, `${config.name}.plist`);
    
    // Ensure directory exists
    fs.mkdirSync(plistDir, { recursive: true });
    
    const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${config.name}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${config.execPath}</string>
        ${config.args.map(arg => `        <string>${arg}</string>`).join('\n')}
    </array>
    <key>WorkingDirectory</key>
    <string>${config.workingDir}</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StartInterval</key>
    <integer>${config.delay}</integer>
    <key>StandardOutPath</key>
    <string>/tmp/xmrig-web-ui.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/xmrig-web-ui.log</string>
</dict>
</plist>`;

    fs.writeFileSync(plistFile, plistContent);
    
    // Load the service
    try {
      execSync(`launchctl load "${plistFile}"`, { stdio: globalOpts.verbose ? 'inherit' : 'pipe' });
    } catch (error) {
      // Service might already be loaded, try unload first
      try {
        execSync(`launchctl unload "${plistFile}"`, { stdio: 'pipe' });
        execSync(`launchctl load "${plistFile}"`, { stdio: globalOpts.verbose ? 'inherit' : 'pipe' });
      } catch (reloadError) {
        throw new Error(`Failed to load service: ${error.message}`);
      }
    }
  }

  static async disableMacOS(config, globalOpts) {
    const plistFile = path.join(os.homedir(), 'Library', 'LaunchAgents', `${config.name}.plist`);
    
    if (fs.existsSync(plistFile)) {
      try {
        execSync(`launchctl unload "${plistFile}"`, { stdio: globalOpts.verbose ? 'inherit' : 'pipe' });
      } catch (error) {
        // Service might not be loaded, continue with file removal
      }
      
      fs.unlinkSync(plistFile);
    }
  }

  static checkMacOSStatus(config) {
    const plistFile = path.join(os.homedir(), 'Library', 'LaunchAgents', `${config.name}.plist`);
    return fs.existsSync(plistFile);
  }

  // Linux systemd implementation
  static async enableLinux(config, globalOpts) {
    // Try user service first, then system service if that fails
    const userServiceDir = path.join(os.homedir(), '.config', 'systemd', 'user');
    const serviceFile = path.join(userServiceDir, `${config.name}.service`);
    
    // Ensure directory exists
    fs.mkdirSync(userServiceDir, { recursive: true });
    
    const serviceContent = `[Unit]
Description=${config.description}
After=network.target

[Service]
Type=simple
User=${config.user}
WorkingDirectory=${config.workingDir}
ExecStart=${config.execPath} ${config.args.join(' ')}
Restart=always
RestartSec=${config.delay}
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=default.target`;

    fs.writeFileSync(serviceFile, serviceContent);
    
    try {
      // Reload systemd and enable service
      execSync('systemctl --user daemon-reload', { stdio: globalOpts.verbose ? 'inherit' : 'pipe' });
      execSync(`systemctl --user enable ${config.name}.service`, { stdio: globalOpts.verbose ? 'inherit' : 'pipe' });
      
      // Enable lingering to allow user services to start at boot
      try {
        execSync('loginctl enable-linger', { stdio: 'pipe' });
      } catch (error) {
        // Might not have permission, but service will still work when user logs in
      }
    } catch (error) {
      throw new Error(`Failed to enable systemd service: ${error.message}`);
    }
  }

  static async disableLinux(config, globalOpts) {
    const serviceFile = path.join(os.homedir(), '.config', 'systemd', 'user', `${config.name}.service`);
    
    if (fs.existsSync(serviceFile)) {
      try {
        execSync(`systemctl --user disable ${config.name}.service`, { stdio: globalOpts.verbose ? 'inherit' : 'pipe' });
        execSync(`systemctl --user stop ${config.name}.service`, { stdio: 'pipe' });
      } catch (error) {
        // Service might not be running/enabled, continue with file removal
      }
      
      fs.unlinkSync(serviceFile);
      
      try {
        execSync('systemctl --user daemon-reload', { stdio: 'pipe' });
      } catch (error) {
        // Ignore reload errors
      }
    }
  }

  static checkLinuxStatus(config) {
    const serviceFile = path.join(os.homedir(), '.config', 'systemd', 'user', `${config.name}.service`);
    const exists = fs.existsSync(serviceFile);
    
    let enabled = false;
    let active = false;
    
    if (exists) {
      try {
        const status = execSync(`systemctl --user is-enabled ${config.name}.service`, { 
          encoding: 'utf8', 
          stdio: 'pipe' 
        }).trim();
        enabled = status === 'enabled';
      } catch (error) {
        enabled = false;
      }
      
      try {
        const status = execSync(`systemctl --user is-active ${config.name}.service`, { 
          encoding: 'utf8', 
          stdio: 'pipe' 
        }).trim();
        active = status === 'active';
      } catch (error) {
        active = false;
      }
    }
    
    return {
      enabled: enabled,
      active: active,
      type: 'systemd user service',
      file: serviceFile
    };
  }

  // Windows implementation (placeholder)
  static async enableWindows(config, globalOpts) {
    throw new Error('Windows autostart is not yet implemented. Use the Windows Task Scheduler to create a startup task manually.');
  }

  static async disableWindows(config, globalOpts) {
    throw new Error('Windows autostart is not yet implemented.');
  }

  static checkWindowsStatus(config) {
    return false; // Not implemented
  }
}

module.exports = AutostartCommand;