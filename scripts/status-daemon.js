#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

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

function checkStatus() {
  if (!fs.existsSync(pidFile)) {
    console.log('❌ XMRig Web UI daemon is not running');
    return;
  }
  
  const pid = parseInt(fs.readFileSync(pidFile, 'utf8'));
  
  if (!isProcessRunning(pid)) {
    console.log('❌ XMRig Web UI daemon is not running (cleaning up PID file)');
    fs.unlinkSync(pidFile);
    return;
  }
  
  console.log('✅ XMRig Web UI daemon is running');
  console.log(`📍 PID: ${pid}`);
  console.log('🌐 URL: http://localhost:4173');
  console.log(`📝 Logs: ${logFile}`);
  
  // Show some recent log lines if available
  if (fs.existsSync(logFile)) {
    try {
      const logs = fs.readFileSync(logFile, 'utf8');
      const lines = logs.split('\n').filter(line => line.trim()).slice(-5);
      if (lines.length > 0) {
        console.log('\n📄 Recent logs:');
        lines.forEach(line => console.log(`   ${line}`));
      }
    } catch (e) {
      // Ignore log reading errors
    }
  }
}

if (require.main === module) {
  checkStatus();
}