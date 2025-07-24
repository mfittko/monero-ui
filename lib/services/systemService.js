const { spawn, execSync } = require('child_process');

/**
 * System service that handles all system operations
 * This service provides simple wrapper functions that can be easily mocked
 */
class SystemService {
  /**
   * Execute a command synchronously
   * @param {string} command - Command to execute
   * @param {object} options - Execution options
   * @returns {Buffer} - Command output
   */
  static execSync(command, options = {}) {
    return execSync(command, options);
  }

  /**
   * Spawn a child process
   * @param {string} command - Command to spawn
   * @param {Array} args - Command arguments
   * @param {object} options - Spawn options
   * @returns {ChildProcess} - Spawned process
   */
  static spawn(command, args, options = {}) {
    return spawn(command, args, options);
  }

  /**
   * Check if a process is running by PID
   * @param {number} pid - Process ID to check
   * @returns {boolean} - True if process is running
   */
  static isProcessRunning(pid) {
    try {
      process.kill(pid, 0);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Kill a process by PID
   * @param {number} pid - Process ID to kill
   * @param {string} signal - Signal to send (default: 'SIGTERM')
   * @returns {boolean} - True if successful
   */
  static killProcess(pid, signal = 'SIGTERM') {
    try {
      process.kill(pid, signal);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} - Promise that resolves after sleep
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = SystemService;