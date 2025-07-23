const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, execSync } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');
const boxen = require('boxen');

const pidFile = path.join(os.tmpdir(), 'xmrig-web-ui.pid');
const logFile = path.join(os.tmpdir(), 'xmrig-web-ui.log');
const projectDir = path.resolve(__dirname, '../../../');

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return false;
  }
}

function getPidInfo() {
  if (!fs.existsSync(pidFile)) {
    return null;
  }
  
  const pid = parseInt(fs.readFileSync(pidFile, 'utf8'));
  const isRunning = isProcessRunning(pid);
  
  if (!isRunning) {
    // Clean up stale PID file
    fs.unlinkSync(pidFile);
    return null;
  }
  
  return { pid, isRunning };
}

async function buildProduction(globalOpts) {
  const spinner = ora('Building production bundle...').start();
  
  try {
    execSync('npm run build', { 
      cwd: projectDir,
      stdio: globalOpts.verbose ? 'inherit' : 'pipe'
    });
    spinner.succeed('Production build completed');
  } catch (error) {
    spinner.fail('Build failed');
    throw new Error(`Build failed: ${error.message}`);
  }
}

async function openBrowser(url, globalOpts) {
  if (globalOpts.quiet) return;
  
  try {
    const open = require('open');
    await open(url);
  } catch (error) {
    // open is not available, provide manual instructions
    if (!globalOpts.quiet) {
      console.log(chalk.blue(`🌐 Open your browser to: ${url}`));
    }
  }
}

class DaemonCommand {
  static async start(options, globalOpts) {
    const pidInfo = getPidInfo();
    
    if (pidInfo) {
      const message = `XMRig Web UI is already running (PID: ${pidInfo.pid})`;
      const url = `http://localhost:${options.port}`;
      
      if (globalOpts.json) {
        console.log(JSON.stringify({
          status: 'already_running',
          pid: pidInfo.pid,
          url: url,
          message: message
        }, null, 2));
      } else {
        console.log(chalk.green('✅'), message);
        console.log(chalk.blue('🌐 Access at:'), url);
      }
      
      return;
    }

    // Build production bundle if needed
    const distDir = path.join(projectDir, 'dist');
    if (!fs.existsSync(distDir) || fs.readdirSync(distDir).length === 0) {
      await buildProduction(globalOpts);
    }

    const url = `http://${options.host === '0.0.0.0' ? 'localhost' : options.host}:${options.port}`;
    
    if (options.daemon) {
      await this.startDaemon(options, globalOpts, url);
    } else {
      await this.startForeground(options, globalOpts, url);
    }
  }

  static async startDaemon(options, globalOpts, url) {
    const spinner = ora('Starting XMRig Web UI daemon...').start();
    
    try {
      const child = spawn('npm', ['run', 'preview', '--', '--port', options.port, '--host', options.host], {
        cwd: projectDir,
        detached: true,
        stdio: ['ignore', 'ignore', 'ignore']
      });

      // Save PID
      fs.writeFileSync(pidFile, child.pid.toString());
      
      // Detach the child process
      child.unref();
      
      // Wait a moment to ensure startup
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify it's running
      if (!isProcessRunning(child.pid)) {
        throw new Error('Failed to start daemon - process exited');
      }
      
      spinner.succeed('XMRig Web UI daemon started successfully');
      
      if (globalOpts.json) {
        console.log(JSON.stringify({
          status: 'started',
          mode: 'daemon',
          pid: child.pid,
          url: url,
          port: options.port,
          host: options.host
        }, null, 2));
      } else {
        console.log(boxen(
          chalk.green.bold('🚀 XMRig Web UI Started!\n\n') +
          chalk.white(`URL: ${chalk.cyan(url)}\n`) +
          chalk.white(`PID: ${chalk.yellow(child.pid)}\n`) +
          chalk.white(`Mode: ${chalk.magenta('Daemon')}\n\n`) +
          chalk.gray('Use ') + chalk.cyan('xmrig-ui stop') + chalk.gray(' to stop the service'),
          {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'green'
          }
        ));
        
        // Try to open browser
        await openBrowser(url, globalOpts);
      }
    } catch (error) {
      spinner.fail('Failed to start daemon');
      throw error;
    }
  }

  static async startForeground(options, globalOpts, url) {
    if (!globalOpts.quiet) {
      console.log(boxen(
        chalk.green.bold('🚀 Starting XMRig Web UI\n\n') +
        chalk.white(`URL: ${chalk.cyan(url)}\n`) +
        chalk.white(`Mode: ${chalk.magenta('Foreground')}\n\n`) +
        chalk.gray('Press ') + chalk.cyan('Ctrl+C') + chalk.gray(' to stop'),
        {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'green'
        }
      ));
      
      // Try to open browser
      await openBrowser(url, globalOpts);
    }

    // Start in foreground
    const child = spawn('npm', ['run', 'preview', '--', '--port', options.port, '--host', options.host], {
      cwd: projectDir,
      stdio: 'inherit'
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n🛑 Shutting down...'));
      child.kill('SIGTERM');
    });

    process.on('SIGTERM', () => {
      child.kill('SIGTERM');
    });

    child.on('exit', (code) => {
      if (code !== 0 && !globalOpts.quiet) {
        console.log(chalk.red(`\n✖ Process exited with code ${code}`));
      }
      process.exit(code);
    });
  }

  static async stop(options, globalOpts) {
    const pidInfo = getPidInfo();
    
    if (!pidInfo) {
      const message = 'XMRig Web UI is not running';
      
      if (globalOpts.json) {
        console.log(JSON.stringify({
          status: 'not_running',
          message: message
        }, null, 2));
      } else {
        console.log(chalk.yellow('⚠️'), message);
      }
      return;
    }

    const spinner = ora(`Stopping XMRig Web UI (PID: ${pidInfo.pid})...`).start();
    
    try {
      process.kill(pidInfo.pid, 'SIGTERM');
      
      // Wait for graceful shutdown
      let attempts = 0;
      while (isProcessRunning(pidInfo.pid) && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      // Force kill if still running
      if (isProcessRunning(pidInfo.pid)) {
        process.kill(pidInfo.pid, 'SIGKILL');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Clean up PID file
      if (fs.existsSync(pidFile)) {
        fs.unlinkSync(pidFile);
      }
      
      spinner.succeed('XMRig Web UI stopped successfully');
      
      if (globalOpts.json) {
        console.log(JSON.stringify({
          status: 'stopped',
          pid: pidInfo.pid
        }, null, 2));
      } else {
        console.log(chalk.green('✅ XMRig Web UI stopped'));
      }
    } catch (error) {
      spinner.fail('Failed to stop XMRig Web UI');
      
      if (globalOpts.json) {
        console.log(JSON.stringify({
          status: 'error',
          message: error.message
        }, null, 2));
      } else {
        console.error(chalk.red('✖'), error.message);
      }
    }
  }

  static async restart(options, globalOpts) {
    if (!globalOpts.quiet) {
      console.log(chalk.blue('🔄 Restarting XMRig Web UI...'));
    }
    
    await this.stop({}, { ...globalOpts, quiet: true });
    
    // Wait a moment between stop and start
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await this.start({ ...options, daemon: true }, globalOpts);
  }

  static async status(options, globalOpts) {
    const pidInfo = getPidInfo();
    
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      uptime: os.uptime(),
      memory: {
        total: Math.round(os.totalmem() / 1024 / 1024 / 1024 * 100) / 100,
        free: Math.round(os.freemem() / 1024 / 1024 / 1024 * 100) / 100
      },
      loadavg: os.loadavg()
    };

    const status = {
      service: pidInfo ? {
        status: 'running',
        pid: pidInfo.pid,
        url: 'http://localhost:4173' // default, could be dynamic
      } : {
        status: 'stopped'
      },
      system: systemInfo,
      logs: {
        file: logFile,
        exists: fs.existsSync(logFile),
        size: fs.existsSync(logFile) ? fs.statSync(logFile).size : 0
      }
    };

    if (globalOpts.json) {
      console.log(JSON.stringify(status, null, 2));
    } else {
      console.log(boxen(
        chalk.bold('XMRig Web UI Status\n\n') +
        chalk.white('Service: ') + (pidInfo ? 
          chalk.green(`Running (PID: ${pidInfo.pid})`) : 
          chalk.red('Stopped')) + '\n' +
        (pidInfo ? chalk.white('URL: ') + chalk.cyan('http://localhost:4173') + '\n\n' : '\n') +
        chalk.white('System Information:\n') +
        chalk.gray(`Platform: ${systemInfo.platform} (${systemInfo.arch})\n`) +
        chalk.gray(`Node.js: ${systemInfo.nodeVersion}\n`) +
        chalk.gray(`Uptime: ${Math.floor(systemInfo.uptime / 3600)}h ${Math.floor((systemInfo.uptime % 3600) / 60)}m\n`) +
        chalk.gray(`Memory: ${systemInfo.memory.free}GB free / ${systemInfo.memory.total}GB total\n`) +
        chalk.gray(`Load: ${systemInfo.loadavg.map(l => l.toFixed(2)).join(', ')}`),
        {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: pidInfo ? 'green' : 'yellow'
        }
      ));
    }
  }
}

module.exports = DaemonCommand;