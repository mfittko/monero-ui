const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * File service that handles all file system operations
 * This service provides simple wrapper functions that can be easily mocked
 */
class FileService {
  /**
   * Check if a file or directory exists
   * @param {string} filePath - Path to check
   * @returns {boolean} - True if exists
   */
  static exists(filePath) {
    return fs.existsSync(filePath);
  }

  /**
   * Read file content synchronously
   * @param {string} filePath - File path to read
   * @param {string} encoding - File encoding (default: 'utf8')
   * @returns {string} - File content
   */
  static readFile(filePath, encoding = 'utf8') {
    return fs.readFileSync(filePath, encoding);
  }

  /**
   * Write file content synchronously
   * @param {string} filePath - File path to write
   * @param {string} content - Content to write
   * @param {string} encoding - File encoding (default: 'utf8')
   */
  static writeFile(filePath, content, encoding = 'utf8') {
    return fs.writeFileSync(filePath, content, encoding);
  }

  /**
   * Delete a file
   * @param {string} filePath - File path to delete
   */
  static deleteFile(filePath) {
    return fs.unlinkSync(filePath);
  }

  /**
   * Create a directory recursively
   * @param {string} dirPath - Directory path to create
   * @param {object} options - Create options
   */
  static createDirectory(dirPath, options = { recursive: true }) {
    return fs.mkdirSync(dirPath, options);
  }

  /**
   * Read directory contents
   * @param {string} dirPath - Directory path to read
   * @returns {Array} - Array of file/directory names
   */
  static readDirectory(dirPath) {
    return fs.readdirSync(dirPath);
  }

  /**
   * Get file stats
   * @param {string} filePath - File path to stat
   * @returns {fs.Stats} - File stats object
   */
  static getStats(filePath) {
    return fs.statSync(filePath);
  }

  /**
   * Get temporary directory path
   * @returns {string} - Temporary directory path
   */
  static getTempDir() {
    return os.tmpdir();
  }

  /**
   * Get home directory path
   * @returns {string} - Home directory path
   */
  static getHomeDir() {
    return os.homedir();
  }

  /**
   * Join path segments
   * @param {...string} segments - Path segments to join
   * @returns {string} - Joined path
   */
  static joinPath(...segments) {
    return path.join(...segments);
  }

  /**
   * Resolve absolute path
   * @param {...string} segments - Path segments to resolve
   * @returns {string} - Resolved absolute path
   */
  static resolvePath(...segments) {
    return path.resolve(...segments);
  }
}

module.exports = FileService;