const fs = require('fs');
const inquirer = require('inquirer');

describe('Config Command Tests - Working Version', () => {
  let ConfigCommand;
  let mockGlobalOptions;

  beforeAll(() => {
    ConfigCommand = require('../../lib/cli/commands/config');
  });

  beforeEach(() => {
    mockGlobalOptions = {
      json: false,
      quiet: true,
      verbose: false
    };

    jest.clearAllMocks();
    
    fs.existsSync.mockReturnValue(false);
    fs.readFileSync.mockReturnValue(JSON.stringify({
      server: { port: 4173, host: '0.0.0.0' },
      xmrig: { apiUrl: 'http://localhost:8080' }
    }));
  });

  describe('module structure', () => {
    test('should export ConfigCommand class with static methods', () => {
      expect(ConfigCommand).toBeDefined();
      expect(typeof ConfigCommand.show).toBe('function');
      expect(typeof ConfigCommand.edit).toBe('function');
      expect(typeof ConfigCommand.reset).toBe('function');
    });
  });

  describe('show command', () => {
    test('should handle showing config when file exists', async () => {
      fs.existsSync.mockReturnValue(true);
      
      await expect(ConfigCommand.show({}, mockGlobalOptions)).resolves.not.toThrow();
      expect(fs.readFileSync).toHaveBeenCalled();
    });

    test('should handle showing config when file does not exist', async () => {
      fs.existsSync.mockReturnValue(false);
      
      await expect(ConfigCommand.show({}, mockGlobalOptions)).resolves.not.toThrow();
    });

    test('should handle JSON output format', async () => {
      const jsonOptions = { ...mockGlobalOptions, json: true };
      fs.existsSync.mockReturnValue(true);

      await expect(ConfigCommand.show({}, jsonOptions)).resolves.not.toThrow();
    });
  });

  describe('reset command', () => {
    test('should handle reset when user confirms', async () => {
      inquirer.prompt.mockResolvedValue({ confirm: true });
      fs.existsSync.mockReturnValue(true);

      await expect(ConfigCommand.reset({}, mockGlobalOptions)).resolves.not.toThrow();
    });

    test('should handle reset when user cancels', async () => {
      inquirer.prompt.mockResolvedValue({ confirm: false });
      
      await expect(ConfigCommand.reset({}, mockGlobalOptions)).resolves.not.toThrow();
    });

    test('should handle JSON output format', async () => {
      const jsonOptions = { ...mockGlobalOptions, json: true };
      inquirer.prompt.mockResolvedValue({ confirm: true });

      await expect(ConfigCommand.reset({}, jsonOptions)).resolves.not.toThrow();
    });
  });
});