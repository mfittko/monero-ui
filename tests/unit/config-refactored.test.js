const SystemService = require('../../lib/services/systemService');
const FileService = require('../../lib/services/fileService');
const UIService = require('../../lib/services/uiService');
const ConfigCommand = require('../../lib/cli/commands/config');

// Mock all services
jest.mock('../../lib/services/systemService');
jest.mock('../../lib/services/fileService');
jest.mock('../../lib/services/uiService');

describe('Config Command Tests with Service Layer', () => {
  let mockOptions;
  let mockGlobalOptions;

  beforeEach(() => {
    mockOptions = {};
    
    mockGlobalOptions = {
      json: false,
      quiet: true,
      verbose: false
    };

    // Clear all mocks
    jest.clearAllMocks();

    // Set up default mock implementations
    FileService.exists.mockReturnValue(false);
    FileService.joinPath.mockImplementation((...args) => args.join('/'));
    FileService.getHomeDir.mockReturnValue('/home/user');
    FileService.getTempDir.mockReturnValue('/tmp');
    FileService.readFile.mockReturnValue('{}');
    FileService.writeFile.mockReturnValue(undefined);
    FileService.deleteFile.mockReturnValue(undefined);
    FileService.createDirectory.mockReturnValue(undefined);
    
    UIService.log.mockReturnValue(undefined);
    UIService.warn.mockReturnValue(undefined);
    UIService.success.mockReturnValue('✅ success');
    UIService.errorMessage.mockReturnValue('❌ error');
    UIService.warningMessage.mockReturnValue('⚠️ warning');
    UIService.info.mockReturnValue('ℹ️ info');
    UIService.colorText.mockImplementation((color, text) => text);
    UIService.createBox.mockImplementation((content) => content);
    UIService.prompt.mockResolvedValue({ confirm: true });
  });

  describe('loadConfig method', () => {
    test('should return default config when file does not exist', () => {
      FileService.exists.mockReturnValue(false);

      const config = ConfigCommand.loadConfig();

      expect(config).toHaveProperty('server');
      expect(config).toHaveProperty('xmrig');
      expect(config).toHaveProperty('ui');
      expect(config.server.port).toBe(4173);
    });

    test('should load existing config file', () => {
      FileService.exists.mockReturnValue(true);
      FileService.readFile.mockReturnValue(JSON.stringify({
        server: { port: 8080 },
        xmrig: { apiUrl: 'http://localhost:8080' }
      }));

      const config = ConfigCommand.loadConfig();

      expect(config.server.port).toBe(8080);
      expect(config.xmrig.apiUrl).toBe('http://localhost:8080');
      expect(FileService.readFile).toHaveBeenCalled();
    });

    test('should handle invalid JSON in config file', () => {
      FileService.exists.mockReturnValue(true);
      FileService.readFile.mockReturnValue('invalid json');

      const config = ConfigCommand.loadConfig();

      expect(UIService.warn).toHaveBeenCalled();
      expect(config.server.port).toBe(4173); // Should return defaults
    });
  });

  describe('saveConfig method', () => {
    test('should save config to file', () => {
      const testConfig = { server: { port: 8080 } };

      ConfigCommand.saveConfig(testConfig);

      expect(FileService.createDirectory).toHaveBeenCalled();
      expect(FileService.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('config.json'),
        JSON.stringify(testConfig, null, 2)
      );
    });
  });

  describe('show command', () => {
    test('should display config in normal mode', async () => {
      FileService.exists.mockReturnValue(true);

      await ConfigCommand.show(mockOptions, mockGlobalOptions);

      expect(UIService.createBox).toHaveBeenCalled();
      expect(UIService.log).toHaveBeenCalled();
    });

    test('should display config in JSON mode', async () => {
      mockGlobalOptions.json = true;
      FileService.exists.mockReturnValue(true);

      await ConfigCommand.show(mockOptions, mockGlobalOptions);

      expect(UIService.log).toHaveBeenCalledWith(expect.stringContaining('"config"'));
    });

    test('should show custom status when config file exists', async () => {
      FileService.exists.mockReturnValue(true);

      await ConfigCommand.show(mockOptions, mockGlobalOptions);

      expect(UIService.createBox).toHaveBeenCalledWith(
        expect.stringContaining('Custom'),
        expect.any(Object)
      );
    });

    test('should show default status when config file does not exist', async () => {
      FileService.exists.mockReturnValue(false);

      await ConfigCommand.show(mockOptions, mockGlobalOptions);

      expect(UIService.createBox).toHaveBeenCalledWith(
        expect.stringContaining('Default'),
        expect.any(Object)
      );
    });
  });

  describe('edit command', () => {
    test('should refuse interactive editing in JSON mode', async () => {
      mockGlobalOptions.json = true;

      await ConfigCommand.edit(mockOptions, mockGlobalOptions);

      expect(UIService.log).toHaveBeenCalledWith(expect.stringContaining('"error"'));
    });

    test('should perform interactive editing', async () => {
      UIService.prompt.mockResolvedValueOnce({
        serverPort: '8080',
        serverHost: '127.0.0.1',
        xmrigApiUrl: 'http://localhost:8080',
        refreshInterval: '3000',
        theme: 'dark',
        autoRefresh: true,
        showSystemInfo: true,
        logLevel: 'info'
      }).mockResolvedValueOnce({ confirm: true });

      await ConfigCommand.edit(mockOptions, mockGlobalOptions);

      expect(UIService.prompt).toHaveBeenCalledTimes(2);
      expect(FileService.writeFile).toHaveBeenCalled();
      expect(UIService.log).toHaveBeenCalledWith(expect.stringContaining('✅'));
    });

    test('should not save config when user cancels', async () => {
      UIService.prompt.mockResolvedValueOnce({
        serverPort: '8080',
        serverHost: '127.0.0.1',
        xmrigApiUrl: 'http://localhost:8080',
        refreshInterval: '3000',
        theme: 'dark',
        autoRefresh: true,
        showSystemInfo: true,
        logLevel: 'info'
      }).mockResolvedValueOnce({ confirm: false });

      await ConfigCommand.edit(mockOptions, mockGlobalOptions);

      expect(FileService.writeFile).not.toHaveBeenCalled();
      expect(UIService.log).toHaveBeenCalledWith(expect.stringContaining('⚠️'));
    });

    test('should validate port input', async () => {
      const questions = [
        {
          type: 'input',
          name: 'serverPort',
          message: 'Server port:',
          default: 4173,
          validate: expect.any(Function)
        }
      ];

      UIService.prompt.mockResolvedValueOnce({});

      await ConfigCommand.edit(mockOptions, mockGlobalOptions);

      expect(UIService.prompt).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          name: 'serverPort',
          validate: expect.any(Function)
        })
      ]));
    });
  });

  describe('reset command', () => {
    test('should reset config when user confirms', async () => {
      FileService.exists.mockReturnValue(true);
      UIService.prompt.mockResolvedValue({ confirm: true });

      await ConfigCommand.reset(mockOptions, mockGlobalOptions);

      expect(UIService.prompt).toHaveBeenCalled();
      expect(FileService.deleteFile).toHaveBeenCalled();
      expect(UIService.log).toHaveBeenCalledWith(expect.stringContaining('✅'));
    });

    test('should not reset config when user cancels', async () => {
      FileService.exists.mockReturnValue(true);
      UIService.prompt.mockResolvedValue({ confirm: false });

      await ConfigCommand.reset(mockOptions, mockGlobalOptions);

      expect(FileService.deleteFile).not.toHaveBeenCalled();
      expect(UIService.log).toHaveBeenCalledWith(expect.stringContaining('ℹ️'));
    });

    test('should handle reset when config already at defaults', async () => {
      FileService.exists.mockReturnValue(false);

      await ConfigCommand.reset(mockOptions, mockGlobalOptions);

      expect(UIService.prompt).not.toHaveBeenCalled();
      expect(UIService.log).toHaveBeenCalledWith(expect.stringContaining('⚠️'));
    });

    test('should handle JSON mode reset', async () => {
      mockGlobalOptions.json = true;
      FileService.exists.mockReturnValue(true);

      await ConfigCommand.reset(mockOptions, mockGlobalOptions);

      expect(UIService.log).toHaveBeenCalledWith(expect.stringContaining('"status"'));
      expect(FileService.deleteFile).toHaveBeenCalled();
    });

    test('should handle JSON mode when already at defaults', async () => {
      mockGlobalOptions.json = true;
      FileService.exists.mockReturnValue(false);

      await ConfigCommand.reset(mockOptions, mockGlobalOptions);

      expect(UIService.log).toHaveBeenCalledWith(expect.stringContaining('"already_default"'));
    });
  });

  describe('formatConfigForDisplay', () => {
    test('should format nested config object', () => {
      const testConfig = {
        server: {
          port: 4173,
          host: '0.0.0.0'
        },
        simpleValue: 'test'
      };

      const result = ConfigCommand.formatConfigForDisplay(testConfig);

      expect(UIService.colorText).toHaveBeenCalledWith('cyan', 'server');
      expect(UIService.colorText).toHaveBeenCalledWith('white', 'port');
      expect(UIService.colorText).toHaveBeenCalledWith('yellow', '4173');
      expect(result).toContain('server');
      expect(result).toContain('port');
    });

    test('should handle string values', () => {
      const testConfig = {
        stringValue: 'test string'
      };

      const result = ConfigCommand.formatConfigForDisplay(testConfig);

      expect(UIService.colorText).toHaveBeenCalledWith('green', '"test string"');
    });
  });

  describe('mergeConfig', () => {
    test('should merge configs correctly', () => {
      const defaults = {
        server: { port: 4173, host: '0.0.0.0' },
        ui: { theme: 'dark' }
      };
      const user = {
        server: { port: 8080 },
        newSection: { value: 'test' }
      };

      const result = ConfigCommand.mergeConfig(defaults, user);

      expect(result.server.port).toBe(8080); // User override
      expect(result.server.host).toBe('0.0.0.0'); // Default preserved
      expect(result.ui.theme).toBe('dark'); // Default preserved
      expect(result.newSection.value).toBe('test'); // New user section
    });
  });
});