const SystemService = require('../../services/systemService');
const FileService = require('../../services/fileService');
const UIService = require('../../services/uiService');

const logFile = FileService.joinPath(FileService.getTempDir(), 'xmrig-web-ui.log');

class LogsCommand {
  static async view(options, globalOpts) {
    if (options.clear) {
      return this.clearLogs(globalOpts);
    }

    if (!FileService.exists(logFile)) {
      const message = 'No log file found. Start the application to generate logs.';
      
      if (globalOpts.json) {
        UIService.log(JSON.stringify({
          status: 'no_logs',
          logFile: logFile,
          message: message
        }, null, 2));
      } else {
        UIService.log(UIService.warningMessage(message));
        UIService.log(UIService.colorText('gray', 'Log file location: ') + logFile);
      }
      return;
    }

    const stats = FileService.getStats(logFile);
    const lines = parseInt(options.lines);

    if (globalOpts.json && !options.follow) {
      const content = this.getLogLines(lines);
      console.log(JSON.stringify({
        logFile: logFile,
        size: stats.size,
        modified: stats.mtime,
        lines: content.split('\n').length,
        content: content
      }, null, 2));
      return;
    }

    if (!globalOpts.quiet) {
      console.log(boxen(
        chalk.blue.bold('XMRig Web UI Logs\n\n') +
        chalk.white(`File: ${chalk.cyan(logFile)}\n`) +
        chalk.white(`Size: ${chalk.yellow(this.formatFileSize(stats.size))}\n`) +
        chalk.white(`Modified: ${chalk.gray(stats.mtime.toLocaleString())}\n`) +
        (options.follow ? 
          chalk.white(`Mode: ${chalk.green('Following')}\n\n`) + 
          chalk.gray('Press Ctrl+C to stop following') :
          chalk.white(`Lines: ${chalk.magenta(lines)}`)),
        {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'blue'
        }
      ));
    }

    if (options.follow) {
      this.followLogs(lines);
    } else {
      const content = this.getLogLines(lines);
      console.log(content);
    }
  }

  static getLogLines(numLines) {
    try {
      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.split('\n');
      
      if (lines.length <= numLines) {
        return content;
      }
      
      return lines.slice(-numLines).join('\n');
    } catch (error) {
      return `Error reading log file: ${error.message}`;
    }
  }

  static followLogs(numLines) {
    // Show initial lines
    const initialContent = this.getLogLines(numLines);
    if (initialContent.trim()) {
      console.log(initialContent);
    }

    // Follow new content
    let lastSize = 0;
    try {
      lastSize = fs.statSync(logFile).size;
    } catch (error) {
      // File might not exist yet
    }

    const followInterval = setInterval(() => {
      try {
        const currentSize = fs.statSync(logFile).size;
        
        if (currentSize > lastSize) {
          const stream = fs.createReadStream(logFile, {
            start: lastSize,
            end: currentSize - 1,
            encoding: 'utf8'
          });
          
          stream.on('data', (chunk) => {
            process.stdout.write(this.colorizeLogOutput(chunk));
          });
          
          lastSize = currentSize;
        }
      } catch (error) {
        // Log file might have been rotated or deleted
        if (error.code !== 'ENOENT') {
          console.error(chalk.red('Error following logs:'), error.message);
        }
      }
    }, 1000);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      clearInterval(followInterval);
      console.log(chalk.yellow('\n🛑 Stopped following logs'));
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      clearInterval(followInterval);
      process.exit(0);
    });
  }

  static colorizeLogOutput(text) {
    return text
      .replace(/\[ERROR\]/g, chalk.red.bold('[ERROR]'))
      .replace(/\[WARN\]/g, chalk.yellow.bold('[WARN]'))
      .replace(/\[INFO\]/g, chalk.blue.bold('[INFO]'))
      .replace(/\[DEBUG\]/g, chalk.gray.bold('[DEBUG]'))
      .replace(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/g, (match) => chalk.gray(match))
      .replace(/HTTP (\d{3})/g, (match, code) => {
        const statusCode = parseInt(code);
        if (statusCode >= 200 && statusCode < 300) {
          return chalk.green(match);
        } else if (statusCode >= 400) {
          return chalk.red(match);
        } else {
          return chalk.yellow(match);
        }
      });
  }

  static async clearLogs(globalOpts) {
    if (!fs.existsSync(logFile)) {
      const message = 'No log file to clear';
      
      if (globalOpts.json) {
        console.log(JSON.stringify({
          status: 'no_logs',
          message: message
        }, null, 2));
      } else {
        console.log(chalk.yellow('⚠️'), message);
      }
      return;
    }

    try {
      const stats = fs.statSync(logFile);
      fs.writeFileSync(logFile, '');
      
      if (globalOpts.json) {
        console.log(JSON.stringify({
          status: 'cleared',
          logFile: logFile,
          previousSize: stats.size
        }, null, 2));
      } else {
        console.log(chalk.green('✅ Log file cleared'));
        console.log(chalk.gray(`Previous size: ${this.formatFileSize(stats.size)}`));
      }
    } catch (error) {
      if (globalOpts.json) {
        console.log(JSON.stringify({
          status: 'error',
          message: error.message
        }, null, 2));
      } else {
        console.error(chalk.red('✖ Failed to clear log file:'), error.message);
      }
    }
  }

  static formatFileSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}

module.exports = LogsCommand;