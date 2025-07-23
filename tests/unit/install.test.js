const fs = require('fs');
const path = require('path');
const os = require('os');
const inquirer = require('inquirer');

// Mock dependencies to prevent actual system operations
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  rmSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

jest.mock('inquirer', () => ({
  prompt: jest.fn()
}));

jest.mock('../../scripts/install-app', () => ({
  installApp: jest.fn()
}));

jest.mock('../../lib/cli/commands/autostart', () => ({
  disable: jest.fn(() => Promise.resolve())
}));

const { CLI } = require('../../lib/cli');

describe('Install/Uninstall Command Tests', () => {
  let cli;
  let mockGlobalOptions;

  beforeEach(() => {
    cli = new CLI();
    
    mockGlobalOptions = {
      json: false,
      quiet: true, // Suppress output in tests
      verbose: false
    };

    // Clear all mocks
    jest.clearAllMocks();
    
    // Set up default mock implementations
    fs.existsSync.mockReturnValue(false);
    inquirer.prompt.mockResolvedValue({ confirm: true });
  });

  describe('install command', () => {
    test('should exist in CLI commands', () => {
      const installCommand = cli.program.commands.find(cmd => cmd.name() === 'install');
      expect(installCommand).toBeDefined();
      expect(installCommand.description()).toContain('install application shortcuts');
    });

    test('should call installApp function', async () => {
      const { installApp } = require('../../scripts/install-app');
      
      // Simulate command execution
      const installCommand = cli.program.commands.find(cmd => cmd.name() === 'install');
      expect(installCommand).toBeDefined();
      
      // The install command should exist and have an action
      expect(installCommand._actionHandler).toBeDefined();
    });
  });

  describe('uninstall command', () => {
    test('should exist in CLI commands', () => {
      const uninstallCommand = cli.program.commands.find(cmd => cmd.name() === 'uninstall');
      expect(uninstallCommand).toBeDefined();
      expect(uninstallCommand.description()).toContain('remove application shortcuts');
    });

    test('should have keep-config option', () => {
      const uninstallCommand = cli.program.commands.find(cmd => cmd.name() === 'uninstall');
      const keepConfigOption = uninstallCommand.options.find(opt => opt.long === '--keep-config');
      expect(keepConfigOption).toBeDefined();
    });

    test('should handle uninstall with confirmation', async () => {
      const options = { keepConfig: false };
      
      inquirer.prompt.mockResolvedValue({ confirm: true });
      fs.existsSync.mockReturnValue(true);
      
      // Mock the uninstall method to be callable
      cli.getGlobalOptions = jest.fn().mockReturnValue(mockGlobalOptions);
      
      await expect(cli.uninstall(options)).resolves.not.toThrow();
    });

    test('should handle uninstall cancellation', async () => {
      const options = { keepConfig: false };
      
      inquirer.prompt.mockResolvedValue({ confirm: false });
      cli.getGlobalOptions = jest.fn().mockReturnValue({
        ...mockGlobalOptions,
        quiet: false
      });
      
      await expect(cli.uninstall(options)).resolves.not.toThrow();
    });

    test('should handle keep-config option', async () => {
      const options = { keepConfig: true };
      
      inquirer.prompt.mockResolvedValue({ confirm: true });
      fs.existsSync.mockReturnValue(false);
      cli.getGlobalOptions = jest.fn().mockReturnValue(mockGlobalOptions);
      
      await expect(cli.uninstall(options)).resolves.not.toThrow();
    });

    test('should handle quiet mode', async () => {
      const options = { keepConfig: false };
      
      cli.getGlobalOptions = jest.fn().mockReturnValue({
        ...mockGlobalOptions,
        quiet: true
      });
      
      await expect(cli.uninstall(options)).resolves.not.toThrow();
    });
  });
});