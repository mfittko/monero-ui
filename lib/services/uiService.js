const ora = require('ora');
const chalk = require('chalk');
const boxen = require('boxen');
const inquirer = require('inquirer');

/**
 * UI service that handles all user interface operations
 * This service provides simple wrapper functions that can be easily mocked
 */
class UIService {
  /**
   * Create a spinner instance
   * @param {string} text - Initial spinner text
   * @returns {object} - Spinner instance
   */
  static createSpinner(text = '') {
    return ora(text);
  }

  /**
   * Create a colored text string
   * @param {string} color - Color name
   * @param {string} text - Text to color
   * @returns {string} - Colored text
   */
  static colorText(color, text) {
    return chalk[color](text);
  }

  /**
   * Create a boxed message
   * @param {string} content - Box content
   * @param {object} options - Box options
   * @returns {string} - Boxed message
   */
  static createBox(content, options = {}) {
    return boxen(content, options);
  }

  /**
   * Prompt user for input
   * @param {object|Array} questions - Questions to ask
   * @returns {Promise} - User responses
   */
  static async prompt(questions) {
    return inquirer.prompt(questions);
  }

  /**
   * Log a message to console
   * @param {string} message - Message to log
   */
  static log(message) {
    console.log(message);
  }

  /**
   * Log an error message to console
   * @param {string} message - Error message to log
   */
  static error(message) {
    console.error(message);
  }

  /**
   * Log a warning message to console
   * @param {string} message - Warning message to log
   */
  static warn(message) {
    console.warn(message);
  }

  /**
   * Open URL in browser (with fallback)
   * @param {string} url - URL to open
   * @returns {Promise} - Promise that resolves when browser opens
   */
  static async openBrowser(url) {
    try {
      const open = require('open');
      await open(url);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create a success message with emoji
   * @param {string} message - Success message
   * @returns {string} - Formatted success message
   */
  static success(message) {
    return chalk.green('✅') + ' ' + message;
  }

  /**
   * Create an error message with emoji
   * @param {string} message - Error message
   * @returns {string} - Formatted error message
   */
  static errorMessage(message) {
    return chalk.red('❌') + ' ' + message;
  }

  /**
   * Create a warning message with emoji
   * @param {string} message - Warning message
   * @returns {string} - Formatted warning message
   */
  static warningMessage(message) {
    return chalk.yellow('⚠️') + ' ' + message;
  }

  /**
   * Create an info message with emoji
   * @param {string} message - Info message
   * @returns {string} - Formatted info message
   */
  static info(message) {
    return chalk.blue('ℹ️') + ' ' + message;
  }
}

module.exports = UIService;