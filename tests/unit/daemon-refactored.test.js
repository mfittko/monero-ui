const SystemService = require('../../lib/services/systemService');
const FileService = require('../../lib/services/fileService');
const UIService = require('../../lib/services/uiService');
const DaemonCommand = require('../../lib/cli/commands/daemon');

// Mock all services
jest.mock('../../lib/services/systemService');
jest.mock('../../lib/services/fileService');
jest.mock('../../lib/services/uiService');

describe('Daemon Command Tests with Service Layer', () => {
  let mockOptions;
  let mockGlobalOptions;

  beforeEach(() => {
    mockOptions = {
      port: '4173',
      host: '0.0.0.0',
      daemon: false
    };
    
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
    FileService.resolvePath.mockImplementation((...args) => '/' + args.join('/'));
    FileService.getTempDir.mockReturnValue('/tmp');
    FileService.readFile.mockReturnValue('12345');
    FileService.writeFile.mockReturnValue(undefined);
    FileService.deleteFile.mockReturnValue(undefined);
    FileService.readDirectory.mockReturnValue(['index.html']);
    
    SystemService.isProcessRunning.mockReturnValue(false);
    SystemService.execSync.mockReturnValue('build output');
    SystemService.spawn.mockReturnValue({
      pid: 12345,
      unref: jest.fn(),
      kill: jest.fn(),
      on: jest.fn()
    });
    SystemService.sleep.mockResolvedValue(undefined);
    SystemService.killProcess.mockReturnValue(true);

    const mockSpinner = {
      start: jest.fn().mockReturnThis(),
      succeed: jest.fn().mockReturnThis(),
      fail: jest.fn().mockReturnThis(),
      stop: jest.fn().mockReturnThis()
    };
    UIService.createSpinner.mockReturnValue(mockSpinner);
    UIService.log.mockReturnValue(undefined);
    UIService.success.mockReturnValue('✅ success');
    UIService.errorMessage.mockReturnValue('❌ error');
    UIService.warningMessage.mockReturnValue('⚠️ warning');
    UIService.colorText.mockImplementation((color, text) => text);
    UIService.createBox.mockImplementation((content) => content);
    UIService.openBrowser.mockResolvedValue(true);
  });

  describe('start command', () => {
    test('should handle already running daemon', async () => {
      // Mock process already running
      FileService.exists.mockReturnValue(true);
      SystemService.isProcessRunning.mockReturnValue(true);

      await DaemonCommand.start(mockOptions, mockGlobalOptions);

      expect(FileService.readFile).toHaveBeenCalled();
      expect(UIService.log).toHaveBeenCalledWith(expect.stringContaining('✅'));
    });

    test('should build production if dist missing', async () => {
      FileService.exists.mockReturnValueOnce(false); // PID file doesn't exist
      FileService.exists.mockReturnValueOnce(false); // dist directory doesn't exist

      await DaemonCommand.start(mockOptions, mockGlobalOptions);

      expect(SystemService.execSync).toHaveBeenCalledWith('npm run build', expect.any(Object));
      expect(UIService.createSpinner).toHaveBeenCalledWith('Building production bundle...');
    });

    test('should start daemon successfully', async () => {
      mockOptions.daemon = true;
      FileService.exists.mockReturnValueOnce(false); // PID file doesn't exist
      FileService.exists.mockReturnValueOnce(true); // dist directory exists
      FileService.readDirectory.mockReturnValue(['index.html']);
      SystemService.isProcessRunning.mockReturnValue(true); // Process starts successfully

      await DaemonCommand.start(mockOptions, mockGlobalOptions);

      expect(SystemService.spawn).toHaveBeenCalledWith('npm', 
        ['run', 'preview', '--', '--port', '4173', '--host', '0.0.0.0'], 
        expect.any(Object)
      );
      expect(FileService.writeFile).toHaveBeenCalled();
    });

    test('should start foreground successfully', async () => {
      mockOptions.daemon = false;
      FileService.exists.mockReturnValueOnce(false); // PID file doesn't exist
      FileService.exists.mockReturnValueOnce(true); // dist directory exists
      FileService.readDirectory.mockReturnValue(['index.html']);

      await DaemonCommand.start(mockOptions, mockGlobalOptions);

      expect(SystemService.spawn).toHaveBeenCalledWith('npm', 
        ['run', 'preview', '--', '--port', '4173', '--host', '0.0.0.0'], 
        expect.any(Object)
      );
    });
  });

  describe('stop command', () => {
    test('should handle stop when not running', async () => {
      FileService.exists.mockReturnValue(false);

      await DaemonCommand.stop(mockOptions, mockGlobalOptions);

      expect(UIService.log).toHaveBeenCalledWith(expect.stringContaining('⚠️'));
    });

    test('should stop running daemon', async () => {
      FileService.exists.mockReturnValue(true);
      SystemService.isProcessRunning.mockReturnValue(true);

      await DaemonCommand.stop(mockOptions, mockGlobalOptions);

      expect(SystemService.killProcess).toHaveBeenCalledWith(12345, 'SIGTERM');
      expect(FileService.deleteFile).toHaveBeenCalled();
    });

    test('should force kill if graceful shutdown fails', async () => {
      FileService.exists.mockReturnValue(true);
      SystemService.isProcessRunning
        .mockReturnValueOnce(true) // Initially running
        .mockReturnValue(true); // Still running after SIGTERM

      await DaemonCommand.stop(mockOptions, mockGlobalOptions);

      expect(SystemService.killProcess).toHaveBeenCalledWith(12345, 'SIGTERM');
      expect(SystemService.killProcess).toHaveBeenCalledWith(12345, 'SIGKILL');
    });
  });

  describe('restart command', () => {
    test('should restart daemon', async () => {
      const stopSpy = jest.spyOn(DaemonCommand, 'stop').mockResolvedValue();
      const startSpy = jest.spyOn(DaemonCommand, 'start').mockResolvedValue();

      await DaemonCommand.restart(mockOptions, mockGlobalOptions);

      expect(stopSpy).toHaveBeenCalled();
      expect(SystemService.sleep).toHaveBeenCalledWith(1000);
      expect(startSpy).toHaveBeenCalled();

      stopSpy.mockRestore();
      startSpy.mockRestore();
    });
  });

  describe('status command', () => {
    test('should show status when daemon is running', async () => {
      FileService.exists.mockReturnValue(true);
      SystemService.isProcessRunning.mockReturnValue(true);
      FileService.getStats.mockReturnValue({ size: 1024 });

      await DaemonCommand.status(mockOptions, mockGlobalOptions);

      expect(UIService.createBox).toHaveBeenCalled();
      expect(UIService.log).toHaveBeenCalled();
    });

    test('should show status when daemon is stopped', async () => {
      FileService.exists.mockReturnValue(false);

      await DaemonCommand.status(mockOptions, mockGlobalOptions);

      expect(UIService.createBox).toHaveBeenCalled();
      expect(UIService.log).toHaveBeenCalled();
    });

    test('should handle JSON output format', async () => {
      mockGlobalOptions.json = true;
      FileService.exists.mockReturnValue(false);

      await DaemonCommand.status(mockOptions, mockGlobalOptions);

      expect(UIService.log).toHaveBeenCalledWith(expect.stringContaining('"service"'));
    });
  });

  describe('error handling', () => {
    test('should handle build failure', async () => {
      FileService.exists.mockReturnValueOnce(false); // PID file doesn't exist
      FileService.exists.mockReturnValueOnce(false); // dist directory doesn't exist  
      SystemService.execSync.mockImplementation(() => {
        throw new Error('Build failed');
      });

      await expect(DaemonCommand.start(mockOptions, mockGlobalOptions)).rejects.toThrow('Build failed');
      
      expect(UIService.createSpinner().fail).toHaveBeenCalledWith('Build failed');
    });

    test('should handle daemon start failure', async () => {
      mockOptions.daemon = true;
      FileService.exists.mockReturnValueOnce(false); // PID file doesn't exist
      FileService.exists.mockReturnValueOnce(true); // dist directory exists
      SystemService.isProcessRunning.mockReturnValue(false); // Process fails to start

      await expect(DaemonCommand.start(mockOptions, mockGlobalOptions)).rejects.toThrow('Failed to start daemon');
    });
  });
});