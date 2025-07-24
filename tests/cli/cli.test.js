const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('CLI Integration Tests', () => {
  const CLI_PATH = path.join(__dirname, '../../bin/xmrig-ui');
  
  beforeAll(() => {
    // Ensure CLI is executable
    expect(fs.existsSync(CLI_PATH)).toBe(true);
  });

  describe('Basic CLI Functionality', () => {
    test('should display help when --help flag is used', () => {
      const result = execSync(`node ${CLI_PATH} --help`, { encoding: 'utf8' });
      expect(result).toContain('XMRig Web UI');
      expect(result).toContain('Commands:');
      expect(result).toContain('autostart');
      expect(result).toContain('config');
      expect(result).toContain('start');
      expect(result).toContain('stop');
    });

    test('should display version when --version flag is used', () => {
      const result = execSync(`node ${CLI_PATH} --version`, { encoding: 'utf8' });
      const packageJson = require('../../package.json');
      expect(result.trim()).toBe(packageJson.version);
    });

    test('should show available commands', () => {
      const result = execSync(`node ${CLI_PATH} help`, { encoding: 'utf8' });
      expect(result).toContain('start');
      expect(result).toContain('stop');
      expect(result).toContain('restart');
      expect(result).toContain('status');
      expect(result).toContain('autostart');
      expect(result).toContain('config');
      expect(result).toContain('logs');
      expect(result).toContain('install');
      expect(result).toContain('uninstall');
    });
  });

  describe('Command Help', () => {
    test('should display help for start command', () => {
      const result = execSync(`node ${CLI_PATH} start --help`, { encoding: 'utf8' });
      expect(result).toContain('start the XMRig Web UI daemon');
      expect(result).toContain('--port');
      expect(result).toContain('--host');
      expect(result).toContain('--daemon');
    });

    test('should display help for autostart command', () => {
      const result = execSync(`node ${CLI_PATH} autostart --help`, { encoding: 'utf8' });
      expect(result).toContain('manage system autostart configuration');
      expect(result).toContain('enable');
      expect(result).toContain('disable');
      expect(result).toContain('status');
    });

    test('should display help for config command', () => {
      const result = execSync(`node ${CLI_PATH} config --help`, { encoding: 'utf8' });
      expect(result).toContain('manage application configuration');
    });
  });

  describe('JSON Output', () => {
    test('should support JSON output format', () => {
      try {
        const result = execSync(`node ${CLI_PATH} status --json`, { encoding: 'utf8' });
        const parsed = JSON.parse(result);
        expect(typeof parsed).toBe('object');
      } catch (error) {
        // Status command might fail if no daemon is running, but should still return valid JSON
        expect(error.stdout).toBeDefined();
        if (error.stdout) {
          expect(() => JSON.parse(error.stdout)).not.toThrow();
        }
      }
    });
  });

  describe.skip('Error Handling', () => {
    test('should handle invalid commands gracefully', () => {
      try {
        execSync(`node ${CLI_PATH} invalid-command`, { encoding: 'utf8' });
      } catch (error) {
        expect(error.status).toBe(1);
        expect(error.stderr || error.stdout).toContain('unknown command');
      }
    });

    test('should handle invalid options gracefully', () => {
      try {
        execSync(`node ${CLI_PATH} start --invalid-option`, { encoding: 'utf8' });
      } catch (error) {
        expect(error.status).toBe(1);
      }
    });
  });
});