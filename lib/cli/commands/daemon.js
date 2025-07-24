const SystemService = require('../../services/systemService');
const FileService = require('../../services/fileService');
const UIService = require('../../services/uiService');

const pidFile = FileService.joinPath(FileService.getTempDir(), 'xmrig-web-ui.pid');
const logFile = FileService.joinPath(FileService.getTempDir(), 'xmrig-web-ui.log');
const projectDir = FileService.resolvePath(__dirname, '../../../');

function getPidInfo() {
  if (!FileService.exists(pidFile)) {
    return null;
  }
  
  const pid = parseInt(FileService.readFile(pidFile));
  const isRunning = SystemService.isProcessRunning(pid);
  
  if (!isRunning) {
    // Clean up stale PID file
    FileService.deleteFile(pidFile);
    return null;
  }
  
  return { pid, isRunning };
}

async function buildProduction(globalOpts) {
  const spinner = UIService.createSpinner('Building production bundle...').start();
  
  try {
    SystemService.execSync('npm run build', { 
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
  
  const opened = await UIService.openBrowser(url);
  if (!opened && !globalOpts.quiet) {
    UIService.log(UIService.colorText('blue', `🌐 Open your browser to: ${url}`));
  }
}

class DaemonCommand {
  static async start(options, globalOpts) {
    const pidInfo = getPidInfo();
    
    if (pidInfo) {
      const message = `XMRig Web UI is already running (PID: ${pidInfo.pid})`;
      const url = `http://localhost:${options.port}`;
      
      if (globalOpts.json) {
        UIService.log(JSON.stringify({
          status: 'already_running',
          pid: pidInfo.pid,
          url: url,
          message: message
        }, null, 2));
      } else {
        UIService.log(UIService.success(message));
        UIService.log(UIService.colorText('blue', '🌐 Access at:') + ' ' + url);
      }
      
      return;
    }

    // Build production bundle if needed
    const distDir = FileService.joinPath(projectDir, 'dist');
    if (!FileService.exists(distDir) || FileService.readDirectory(distDir).length === 0) {
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
    const spinner = UIService.createSpinner('Starting XMRig Web UI daemon...').start();
    
    try {
      const child = SystemService.spawn('npm', ['run', 'preview', '--', '--port', options.port, '--host', options.host], {
        cwd: projectDir,
        detached: true,
        stdio: ['ignore', 'ignore', 'ignore']
      });

      // Save PID
      FileService.writeFile(pidFile, child.pid.toString());
      
      // Detach the child process
      child.unref();
      
      // Wait a moment to ensure startup
      await SystemService.sleep(2000);
      
      // Verify it's running
      if (!SystemService.isProcessRunning(child.pid)) {
        throw new Error('Failed to start daemon - process exited');
      }
      
      spinner.succeed('XMRig Web UI daemon started successfully');
      
      if (globalOpts.json) {
        UIService.log(JSON.stringify({
          status: 'started',
          mode: 'daemon',
          pid: child.pid,
          url: url,
          port: options.port,
          host: options.host
        }, null, 2));
      } else {
        UIService.log(UIService.createBox(
          UIService.colorText('green', '🚀 XMRig Web UI Started!\n\n') +
          UIService.colorText('white', `URL: ${UIService.colorText('cyan', url)}\n`) +
          UIService.colorText('white', `PID: ${UIService.colorText('yellow', child.pid)}\n`) +
          UIService.colorText('white', `Mode: ${UIService.colorText('magenta', 'Daemon')}\n\n`) +
          UIService.colorText('gray', 'Use ') + UIService.colorText('cyan', 'xmrig-ui stop') + UIService.colorText('gray', ' to stop the service'),
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
      UIService.log(UIService.createBox(
        UIService.colorText('green', '🚀 Starting XMRig Web UI\n\n') +
        UIService.colorText('white', `URL: ${UIService.colorText('cyan', url)}\n`) +
        UIService.colorText('white', `Mode: ${UIService.colorText('magenta', 'Foreground')}\n\n`) +
        UIService.colorText('gray', 'Press ') + UIService.colorText('cyan', 'Ctrl+C') + UIService.colorText('gray', ' to stop'),
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
    const child = SystemService.spawn('npm', ['run', 'preview', '--', '--port', options.port, '--host', options.host], {
      cwd: projectDir,
      stdio: 'inherit'
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      UIService.log(UIService.colorText('yellow', '\n🛑 Shutting down...'));
      child.kill('SIGTERM');
    });

    process.on('SIGTERM', () => {
      child.kill('SIGTERM');
    });

    child.on('exit', (code) => {
      if (code !== 0 && !globalOpts.quiet) {
        UIService.log(UIService.colorText('red', `\n✖ Process exited with code ${code}`));
      }
      process.exit(code);
    });
  }

  static async stop(options, globalOpts) {
    const pidInfo = getPidInfo();
    
    if (!pidInfo) {
      const message = 'XMRig Web UI is not running';
      
      if (globalOpts.json) {
        UIService.log(JSON.stringify({
          status: 'not_running',
          message: message
        }, null, 2));
      } else {
        UIService.log(UIService.warningMessage(message));
      }
      return;
    }

    const spinner = UIService.createSpinner(`Stopping XMRig Web UI (PID: ${pidInfo.pid})...`).start();
    
    try {
      SystemService.killProcess(pidInfo.pid, 'SIGTERM');
      
      // Wait for graceful shutdown
      let attempts = 0;
      while (SystemService.isProcessRunning(pidInfo.pid) && attempts < 10) {
        await SystemService.sleep(500);
        attempts++;
      }
      
      // Force kill if still running
      if (SystemService.isProcessRunning(pidInfo.pid)) {
        SystemService.killProcess(pidInfo.pid, 'SIGKILL');
        await SystemService.sleep(1000);
      }
      
      // Clean up PID file
      if (FileService.exists(pidFile)) {
        FileService.deleteFile(pidFile);
      }
      
      spinner.succeed('XMRig Web UI stopped successfully');
      
      if (globalOpts.json) {
        UIService.log(JSON.stringify({
          status: 'stopped',
          pid: pidInfo.pid
        }, null, 2));
      } else {
        UIService.log(UIService.success('XMRig Web UI stopped'));
      }
    } catch (error) {
      spinner.fail('Failed to stop XMRig Web UI');
      
      if (globalOpts.json) {
        UIService.log(JSON.stringify({
          status: 'error',
          message: error.message
        }, null, 2));
      } else {
        UIService.error(UIService.errorMessage(error.message));
      }
    }
  }

  static async restart(options, globalOpts) {
    if (!globalOpts.quiet) {
      UIService.log(UIService.colorText('blue', '🔄 Restarting XMRig Web UI...'));
    }
    
    await this.stop({}, { ...globalOpts, quiet: true });
    
    // Wait a moment between stop and start
    await SystemService.sleep(1000);
    
    await this.start({ ...options, daemon: true }, globalOpts);
  }

  static async status(options, globalOpts) {
    const pidInfo = getPidInfo();
    
    const systemInfo = {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      uptime: process.uptime(),
      memory: {
        total: Math.round(process.memoryUsage().rss / 1024 / 1024),
        free: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
      }
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
        exists: FileService.exists(logFile),
        size: FileService.exists(logFile) ? FileService.getStats(logFile).size : 0
      }
    };

    if (globalOpts.json) {
      UIService.log(JSON.stringify(status, null, 2));
    } else {
      UIService.log(UIService.createBox(
        UIService.colorText('white', 'XMRig Web UI Status\n\n') +
        UIService.colorText('white', 'Service: ') + (pidInfo ? 
          UIService.colorText('green', `Running (PID: ${pidInfo.pid})`) : 
          UIService.colorText('red', 'Stopped')) + '\n' +
        (pidInfo ? UIService.colorText('white', 'URL: ') + UIService.colorText('cyan', 'http://localhost:4173') + '\n\n' : '\n') +
        UIService.colorText('white', 'System Information:\n') +
        UIService.colorText('gray', `Platform: ${systemInfo.platform} (${systemInfo.arch})\n`) +
        UIService.colorText('gray', `Node.js: ${systemInfo.nodeVersion}\n`) +
        UIService.colorText('gray', `Uptime: ${Math.floor(systemInfo.uptime / 3600)}h ${Math.floor((systemInfo.uptime % 3600) / 60)}m\n`) +
        UIService.colorText('gray', `Memory: ${systemInfo.memory.free}MB / ${systemInfo.memory.total}MB total`),
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