const SystemService = require('../../services/systemService');
const FileService = require('../../services/fileService');
const UIService = require('../../services/uiService');

const configDir = FileService.joinPath(FileService.getHomeDir(), '.xmrig-ui');
const configFile = FileService.joinPath(configDir, 'config.json');

const defaultConfig = {
  server: {
    port: 4173,
    host: '0.0.0.0'
  },
  xmrig: {
    apiUrl: 'http://localhost:8080',
    refreshInterval: 5000
  },
  ui: {
    theme: 'dark',
    autoRefresh: true,
    showSystemInfo: true
  },
  logging: {
    level: 'info',
    file: FileService.joinPath(FileService.getTempDir(), 'xmrig-web-ui.log'),
    maxSize: '10MB',
    rotate: true
  },
  autostart: {
    enabled: false,
    delay: 10
  }
};

class ConfigCommand {
  static ensureConfigDir() {
    if (!FileService.exists(configDir)) {
      FileService.createDirectory(configDir, { recursive: true });
    }
  }

  static loadConfig() {
    this.ensureConfigDir();
    
    if (!FileService.exists(configFile)) {
      return { ...defaultConfig };
    }
    
    try {
      const userConfig = JSON.parse(FileService.readFile(configFile));
      return this.mergeConfig(defaultConfig, userConfig);
    } catch (error) {
      UIService.warn(UIService.warningMessage('Invalid config file, using defaults'));
      return { ...defaultConfig };
    }
  }

  static saveConfig(config) {
    this.ensureConfigDir();
    FileService.writeFile(configFile, JSON.stringify(config, null, 2));
  }

  static mergeConfig(defaults, user) {
    const merged = { ...defaults };
    
    for (const [key, value] of Object.entries(user)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        merged[key] = { ...merged[key], ...value };
      } else {
        merged[key] = value;
      }
    }
    
    return merged;
  }

  static async show(options, globalOpts) {
    const config = this.loadConfig();
    
    if (globalOpts.json) {
      UIService.log(JSON.stringify({
        config: config,
        configFile: configFile,
        configExists: FileService.exists(configFile)
      }, null, 2));
    } else {
      UIService.log(UIService.createBox(
        UIService.colorText('white', 'XMRig Web UI Configuration\n\n') +
        this.formatConfigForDisplay(config) + '\n\n' +
        UIService.colorText('gray', `Config file: ${configFile}\n`) +
        UIService.colorText('gray', `Status: ${FileService.exists(configFile) ? 'Custom' : 'Default'}`),
        {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'blue'
        }
      ));
    }
  }

  static formatConfigForDisplay(config, indent = '') {
    let output = '';
    
    for (const [key, value] of Object.entries(config)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        output += `${indent}${UIService.colorText('cyan', key)}:\n`;
        output += this.formatConfigForDisplay(value, indent + '  ') + '\n';
      } else {
        const coloredValue = typeof value === 'string' ? 
          UIService.colorText('green', `"${value}"`) : 
          UIService.colorText('yellow', String(value));
        output += `${indent}  ${UIService.colorText('white', key)}: ${coloredValue}\n`;
      }
    }
    
    return output.trim();
  }

  static async edit(options, globalOpts) {
    const config = this.loadConfig();
    
    if (globalOpts.json) {
      UIService.log(JSON.stringify({
        error: true,
        message: 'Interactive editing is not available in JSON mode. Use a text editor to modify the config file.',
        configFile: configFile
      }, null, 2));
      return;
    }

    UIService.log(UIService.createBox(
      UIService.colorText('blue', 'Interactive Configuration Editor\n\n') +
      UIService.colorText('gray', 'Configure XMRig Web UI settings interactively'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'blue'
      }
    ));

    const answers = await UIService.prompt([
      {
        type: 'input',
        name: 'serverPort',
        message: 'Server port:',
        default: config.server.port,
        validate: (input) => {
          const port = parseInt(input);
          return (port > 0 && port < 65536) || 'Port must be between 1 and 65535';
        }
      },
      {
        type: 'input',
        name: 'serverHost',
        message: 'Server host:',
        default: config.server.host
      },
      {
        type: 'input',
        name: 'xmrigApiUrl',
        message: 'XMRig API URL:',
        default: config.xmrig.apiUrl,
        validate: (input) => {
          try {
            new URL(input);
            return true;
          } catch {
            return 'Please enter a valid URL';
          }
        }
      },
      {
        type: 'input',
        name: 'refreshInterval',
        message: 'Refresh interval (ms):',
        default: config.xmrig.refreshInterval,
        validate: (input) => {
          const interval = parseInt(input);
          return (interval >= 1000) || 'Refresh interval must be at least 1000ms';
        }
      },
      {
        type: 'list',
        name: 'theme',
        message: 'UI theme:',
        choices: ['dark', 'light'],
        default: config.ui.theme
      },
      {
        type: 'confirm',
        name: 'autoRefresh',
        message: 'Enable auto-refresh:',
        default: config.ui.autoRefresh
      },
      {
        type: 'confirm',
        name: 'showSystemInfo',
        message: 'Show system information:',
        default: config.ui.showSystemInfo
      },
      {
        type: 'list',
        name: 'logLevel',
        message: 'Logging level:',
        choices: ['error', 'warn', 'info', 'debug'],
        default: config.logging.level
      }
    ]);

    // Update config with answers
    const newConfig = {
      ...config,
      server: {
        port: parseInt(answers.serverPort),
        host: answers.serverHost
      },
      xmrig: {
        apiUrl: answers.xmrigApiUrl,
        refreshInterval: parseInt(answers.refreshInterval)
      },
      ui: {
        theme: answers.theme,
        autoRefresh: answers.autoRefresh,
        showSystemInfo: answers.showSystemInfo
      },
      logging: {
        ...config.logging,
        level: answers.logLevel
      }
    };

    // Preview changes
    UIService.log('\n' + UIService.createBox(
      UIService.colorText('green', 'Configuration Preview\n\n') +
      this.formatConfigForDisplay(newConfig),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green'
      }
    ));

    const { confirm } = await UIService.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Save this configuration?',
        default: true
      }
    ]);

    if (confirm) {
      this.saveConfig(newConfig);
      UIService.log(UIService.success('Configuration saved successfully!'));
      UIService.log(UIService.colorText('gray', `Config file: ${configFile}`));
    } else {
      UIService.log(UIService.warningMessage('Configuration not saved'));
    }
  }

  static async reset(options, globalOpts) {
    if (globalOpts.json) {
      if (FileService.exists(configFile)) {
        FileService.deleteFile(configFile);
        UIService.log(JSON.stringify({
          status: 'reset',
          message: 'Configuration reset to defaults',
          configFile: configFile
        }, null, 2));
      } else {
        UIService.log(JSON.stringify({
          status: 'already_default',
          message: 'Configuration is already using defaults'
        }, null, 2));
      }
      return;
    }

    if (!FileService.exists(configFile)) {
      UIService.log(UIService.warningMessage('Configuration is already using defaults'));
      return;
    }

    const { confirm } = await UIService.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to reset configuration to defaults?',
        default: false
      }
    ]);

    if (confirm) {
      FileService.deleteFile(configFile);
      UIService.log(UIService.success('Configuration reset to defaults'));
    } else {
      UIService.log(UIService.info('Reset cancelled'));
    }
  }
}

module.exports = ConfigCommand;