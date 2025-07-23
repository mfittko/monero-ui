const fs = require('fs');
const path = require('path');
const os = require('os');
const chalk = require('chalk');
const inquirer = require('inquirer');
const boxen = require('boxen');

const configDir = path.join(os.homedir(), '.xmrig-ui');
const configFile = path.join(configDir, 'config.json');

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
    file: path.join(os.tmpdir(), 'xmrig-web-ui.log'),
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
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
  }

  static loadConfig() {
    this.ensureConfigDir();
    
    if (!fs.existsSync(configFile)) {
      return { ...defaultConfig };
    }
    
    try {
      const userConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      return this.mergeConfig(defaultConfig, userConfig);
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Invalid config file, using defaults'));
      return { ...defaultConfig };
    }
  }

  static saveConfig(config) {
    this.ensureConfigDir();
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
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
      console.log(JSON.stringify({
        config: config,
        configFile: configFile,
        configExists: fs.existsSync(configFile)
      }, null, 2));
    } else {
      console.log(boxen(
        chalk.bold('XMRig Web UI Configuration\n\n') +
        this.formatConfigForDisplay(config) + '\n\n' +
        chalk.gray(`Config file: ${configFile}\n`) +
        chalk.gray(`Status: ${fs.existsSync(configFile) ? 'Custom' : 'Default'}`),
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
        output += `${indent}${chalk.cyan(key)}:\n`;
        output += this.formatConfigForDisplay(value, indent + '  ') + '\n';
      } else {
        const coloredValue = typeof value === 'string' ? 
          chalk.green(`"${value}"`) : 
          chalk.yellow(String(value));
        output += `${indent}  ${chalk.white(key)}: ${coloredValue}\n`;
      }
    }
    
    return output.trim();
  }

  static async edit(options, globalOpts) {
    const config = this.loadConfig();
    
    if (globalOpts.json) {
      console.log(JSON.stringify({
        error: true,
        message: 'Interactive editing is not available in JSON mode. Use a text editor to modify the config file.',
        configFile: configFile
      }, null, 2));
      return;
    }

    console.log(boxen(
      chalk.blue.bold('Interactive Configuration Editor\n\n') +
      chalk.gray('Configure XMRig Web UI settings interactively'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'blue'
      }
    ));

    const answers = await inquirer.prompt([
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
    console.log('\n' + boxen(
      chalk.green.bold('Configuration Preview\n\n') +
      this.formatConfigForDisplay(newConfig),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green'
      }
    ));

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Save this configuration?',
        default: true
      }
    ]);

    if (confirm) {
      this.saveConfig(newConfig);
      console.log(chalk.green('✅ Configuration saved successfully!'));
      console.log(chalk.gray(`Config file: ${configFile}`));
    } else {
      console.log(chalk.yellow('⚠️  Configuration not saved'));
    }
  }

  static async reset(options, globalOpts) {
    if (globalOpts.json) {
      if (fs.existsSync(configFile)) {
        fs.unlinkSync(configFile);
        console.log(JSON.stringify({
          status: 'reset',
          message: 'Configuration reset to defaults',
          configFile: configFile
        }, null, 2));
      } else {
        console.log(JSON.stringify({
          status: 'already_default',
          message: 'Configuration is already using defaults'
        }, null, 2));
      }
      return;
    }

    if (!fs.existsSync(configFile)) {
      console.log(chalk.yellow('⚠️  Configuration is already using defaults'));
      return;
    }

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to reset configuration to defaults?',
        default: false
      }
    ]);

    if (confirm) {
      fs.unlinkSync(configFile);
      console.log(chalk.green('✅ Configuration reset to defaults'));
    } else {
      console.log(chalk.blue('ℹ️  Reset cancelled'));
    }
  }
}

module.exports = ConfigCommand;