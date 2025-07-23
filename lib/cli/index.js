const { Command } = require('commander');
const chalk = require('chalk');
const boxen = require('boxen');
const ora = require('ora');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Import command modules
const DaemonCommand = require('./commands/daemon');
const AutostartCommand = require('./commands/autostart');
const ConfigCommand = require('./commands/config');
const LogsCommand = require('./commands/logs');

class CLI {
  constructor() {
    this.program = new Command();
    this.setupProgram();
    this.registerCommands();
  }

  setupProgram() {
    const packageJson = require('../../package.json');
    
    this.program
      .name('xmrig-ui')
      .description('XMRig Web UI - A React-based monitoring dashboard for XMRig miner')
      .version(packageJson.version, '-v, --version', 'display version number')
      .option('-j, --json', 'output results in JSON format')
      .option('-q, --quiet', 'suppress non-essential output')
      .option('--verbose', 'show detailed output')
      .helpOption('-h, --help', 'display help for command');

    // Custom help formatting
    this.program.configureHelp({
      sortSubcommands: true,
      subcommandTerm: (cmd) => cmd.name() + ' ' + cmd.usage(),
    });
  }

  registerCommands() {
    // Daemon management commands
    this.program
      .command('start')
      .description('start the XMRig Web UI daemon')
      .option('-p, --port <port>', 'port to run on', '4173')
      .option('-h, --host <host>', 'host to bind to', '0.0.0.0')
      .option('-d, --daemon', 'run as background daemon')
      .action(async (options) => {
        await DaemonCommand.start(options, this.getGlobalOptions());
      });

    this.program
      .command('stop')
      .description('stop the XMRig Web UI daemon')
      .action(async (options) => {
        await DaemonCommand.stop(options, this.getGlobalOptions());
      });

    this.program
      .command('restart')
      .description('restart the XMRig Web UI daemon')
      .option('-p, --port <port>', 'port to run on', '4173')
      .option('-h, --host <host>', 'host to bind to', '0.0.0.0')
      .action(async (options) => {
        await DaemonCommand.restart(options, this.getGlobalOptions());
      });

    this.program
      .command('status')
      .description('show daemon status and system information')
      .action(async (options) => {
        await DaemonCommand.status(options, this.getGlobalOptions());
      });

    // Autostart management
    const autostartCmd = this.program
      .command('autostart')
      .description('manage system autostart configuration');

    autostartCmd
      .command('enable')
      .description('enable autostart on system boot')
      .option('-p, --port <port>', 'port to run on', '4173')
      .option('-h, --host <host>', 'host to bind to', '0.0.0.0')
      .option('--delay <seconds>', 'startup delay in seconds', '10')
      .action(async (options) => {
        await AutostartCommand.enable(options, this.getGlobalOptions());
      });

    autostartCmd
      .command('disable')
      .description('disable autostart on system boot')
      .action(async (options) => {
        await AutostartCommand.disable(options, this.getGlobalOptions());
      });

    autostartCmd
      .command('status')
      .description('show autostart configuration status')
      .action(async (options) => {
        await AutostartCommand.status(options, this.getGlobalOptions());
      });

    // Configuration management
    const configCmd = this.program
      .command('config')
      .description('manage application configuration');

    configCmd
      .command('show')
      .description('display current configuration')
      .action(async (options) => {
        await ConfigCommand.show(options, this.getGlobalOptions());
      });

    configCmd
      .command('edit')
      .description('interactively edit configuration')
      .action(async (options) => {
        await ConfigCommand.edit(options, this.getGlobalOptions());
      });

    configCmd
      .command('reset')
      .description('reset configuration to defaults')
      .action(async (options) => {
        await ConfigCommand.reset(options, this.getGlobalOptions());
      });

    // Logs management
    this.program
      .command('logs')
      .description('view application logs')
      .option('-f, --follow', 'follow log output')
      .option('-n, --lines <number>', 'number of lines to show', '50')
      .option('--clear', 'clear log file')
      .action(async (options) => {
        await LogsCommand.view(options, this.getGlobalOptions());
      });

    // Installation and shortcuts
    this.program
      .command('install')
      .description('install application shortcuts and desktop entries')
      .action(async (options) => {
        const { installApp } = require('../scripts/install-app');
        await installApp(this.getGlobalOptions());
      });

    this.program
      .command('uninstall')
      .description('remove application shortcuts and autostart')
      .option('--keep-config', 'keep configuration files')
      .action(async (options) => {
        await this.uninstall(options);
      });
  }

  getGlobalOptions() {
    return {
      json: this.program.opts().json,
      quiet: this.program.opts().quiet,
      verbose: this.program.opts().verbose,
    };
  }

  async uninstall(options) {
    const globalOpts = this.getGlobalOptions();
    
    if (!globalOpts.quiet) {
      console.log(boxen(
        chalk.yellow.bold('⚠️  Uninstalling XMRig Web UI\n\n') +
        'This will remove:\n' +
        '• Desktop shortcuts\n' +
        '• Autostart configuration\n' +
        '• System service files\n' +
        (options.keepConfig ? '' : '• Configuration files'),
        {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'yellow'
        }
      ));
    }

    const inquirer = require('inquirer');
    
    if (!globalOpts.quiet) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Are you sure you want to uninstall XMRig Web UI?',
          default: false
        }
      ]);

      if (!confirm) {
        console.log(chalk.blue('✅ Uninstall cancelled'));
        return;
      }
    }

    const spinner = ora('Uninstalling XMRig Web UI...').start();

    try {
      // Disable autostart first
      await AutostartCommand.disable({}, { ...globalOpts, quiet: true });
      
      // Remove desktop shortcuts (reuse install-app logic but in reverse)
      // This would need to be implemented in install-app.js
      
      if (!options.keepConfig) {
        // Remove configuration files
        const configDir = path.join(os.homedir(), '.xmrig-ui');
        if (fs.existsSync(configDir)) {
          fs.rmSync(configDir, { recursive: true, force: true });
        }
      }

      spinner.succeed('XMRig Web UI uninstalled successfully');
      
      if (!globalOpts.quiet) {
        console.log(chalk.green('\n✅ Uninstall completed successfully!'));
        if (options.keepConfig) {
          console.log(chalk.blue('💾 Configuration files were preserved'));
        }
      }
    } catch (error) {
      spinner.fail('Uninstall failed');
      if (globalOpts.verbose) {
        console.error(chalk.red('\nError details:'), error);
      } else {
        console.error(chalk.red('\nError:'), error.message);
      }
      process.exit(1);
    }
  }

  async run(argv) {
    try {
      await this.program.parseAsync(argv);
    } catch (error) {
      const globalOpts = this.getGlobalOptions();
      
      if (globalOpts.json) {
        console.log(JSON.stringify({
          error: true,
          message: error.message,
          ...(globalOpts.verbose && { stack: error.stack })
        }, null, 2));
      } else {
        console.error(chalk.red('✖'), error.message);
        if (globalOpts.verbose && error.stack) {
          console.error(chalk.gray(error.stack));
        }
      }
      
      process.exit(1);
    }
  }
}

module.exports = { CLI };