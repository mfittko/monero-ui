#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const pidFile = path.join(os.tmpdir(), 'xmrig-web-ui.pid');

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return false;
  }
}

function stopDaemon() {
  if (!fs.existsSync(pidFile)) {
    console.log('ℹ️  XMRig Web UI daemon is not running');
    return;
  }
  
  const pid = parseInt(fs.readFileSync(pidFile, 'utf8'));
  
  if (!isProcessRunning(pid)) {
    console.log('ℹ️  XMRig Web UI daemon is not running (cleaning up PID file)');
    fs.unlinkSync(pidFile);
    return;
  }
  
  console.log(`🛑 Stopping XMRig Web UI daemon (PID: ${pid})...`);
  
  try {
    // Try graceful shutdown first
    process.kill(pid, 'SIGTERM');
    
    // Wait a moment and check if it's still running
    setTimeout(() => {
      if (isProcessRunning(pid)) {
        console.log('⚠️  Process didn\'t respond to SIGTERM, using SIGKILL...');
        try {
          process.kill(pid, 'SIGKILL');
        } catch (e) {
          // Process might have already died
        }
      }
      
      // Clean up PID file
      if (fs.existsSync(pidFile)) {
        fs.unlinkSync(pidFile);
      }
      
      console.log('✅ XMRig Web UI daemon stopped');
    }, 2000);
    
  } catch (error) {
    console.error('❌ Failed to stop daemon:', error.message);
    // Clean up PID file anyway
    if (fs.existsSync(pidFile)) {
      fs.unlinkSync(pidFile);
    }
  }
}

if (require.main === module) {
  stopDaemon();
}