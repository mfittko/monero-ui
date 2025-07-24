#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, execSync } = require('child_process');

const projectDir = path.resolve(__dirname, '..');
const pidFile = path.join(os.tmpdir(), 'xmrig-web-ui.pid');
const logFile = path.join(os.tmpdir(), 'xmrig-web-ui.log');

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return false;
  }
}

function checkSingleton() {
  if (fs.existsSync(pidFile)) {
    const pid = parseInt(fs.readFileSync(pidFile, 'utf8'));
    if (isProcessRunning(pid)) {
      console.log(`✅ XMRig Web UI is already running (PID: ${pid})`);
      console.log('🌐 Access at: http://localhost:4173');
      process.exit(0);
    } else {
      // Clean up stale PID file
      fs.unlinkSync(pidFile);
    }
  }
}

function startDaemon() {
  checkSingleton();
  
  console.log('📦 Building project...');
  try {
    execSync('npm run build', { cwd: projectDir, stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
  
  console.log('🚀 Starting XMRig Web UI daemon...');
  
  // Start the preview server in detached mode
  const child = spawn('npm', ['run', 'preview'], {
    cwd: projectDir,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  // Write PID file
  fs.writeFileSync(pidFile, child.pid.toString());
  
  // Set up logging
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });
  child.stdout.pipe(logStream);
  child.stderr.pipe(logStream);
  
  // Detach the child process
  child.unref();
  
  // Wait a moment to check if the process started successfully
  setTimeout(() => {
    if (isProcessRunning(child.pid)) {
      console.log(`✅ XMRig Web UI daemon started (PID: ${child.pid})`);
      console.log('🌐 Access at: http://localhost:4173');
      console.log(`📝 Logs: ${logFile}`);
      console.log('');
      console.log('Use "npm run stop-daemon" to stop the daemon');
      
      // Try to open browser
      const platform = os.platform();
      try {
        if (platform === 'darwin') {
          execSync('open http://localhost:4173', { stdio: 'ignore' });
        } else if (platform === 'linux') {
          execSync('xdg-open http://localhost:4173', { stdio: 'ignore' });
        }
      } catch (e) {
        // Ignore browser opening errors
      }
    } else {
      console.error('❌ Failed to start daemon');
      if (fs.existsSync(pidFile)) {
        fs.unlinkSync(pidFile);
      }
      process.exit(1);
    }
  }, 2000);
}

if (require.main === module) {
  startDaemon();
}