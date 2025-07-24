const fs = require('fs');
const { spawn, execSync } = require('child_process');

describe('Daemon Command Tests - Working Version', () => {
  let DaemonCommand;
  let mockOptions;
  let mockGlobalOptions;

  beforeAll(() => {
    // Import after mocks are set up
    DaemonCommand = require('../../lib/cli/commands/daemon');
  });

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

    // Reset mocks
    jest.clearAllMocks();
    
    // Set up fs mocks
    fs.existsSync.mockReturnValue(false);
    fs.readFileSync.mockReturnValue('12345');
    fs.readdirSync.mockReturnValue(['index.html', 'assets']);
    fs.statSync.mockReturnValue({ size: 1024 });
  });

  describe('module structure', () => {
    test('should export DaemonCommand class with static methods', () => {
      expect(DaemonCommand).toBeDefined();
      expect(typeof DaemonCommand.start).toBe('function');
      expect(typeof DaemonCommand.stop).toBe('function');
      expect(typeof DaemonCommand.restart).toBe('function');
      expect(typeof DaemonCommand.status).toBe('function');
    });
  });

  describe('status command', () => {
    test('should handle status check when not running', async () => {
      fs.existsSync.mockReturnValue(false);
      
      await expect(DaemonCommand.status(mockOptions, mockGlobalOptions)).resolves.not.toThrow();
    });

    test('should handle status check when running', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('12345');
      process.kill.mockReturnValue(true);
      
      await expect(DaemonCommand.status(mockOptions, mockGlobalOptions)).resolves.not.toThrow();
    });

    test('should handle JSON output format', async () => {
      const jsonOptions = { ...mockGlobalOptions, json: true };
      fs.existsSync.mockReturnValue(false);

      await expect(DaemonCommand.status(mockOptions, jsonOptions)).resolves.not.toThrow();
    });
  });

  describe('start command - basic checks', () => {
    test('should handle already running daemon', async () => {
      // Mock process already running
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('12345');
      process.kill.mockReturnValue(true);

      await expect(DaemonCommand.start(mockOptions, mockGlobalOptions)).resolves.not.toThrow();
      
      // Should not attempt to start new process
      expect(spawn).not.toHaveBeenCalled();
    });

    test('should handle JSON output for already running daemon', async () => {
      const jsonOptions = { ...mockGlobalOptions, json: true };
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('12345');
      process.kill.mockReturnValue(true);

      await expect(DaemonCommand.start(mockOptions, jsonOptions)).resolves.not.toThrow();
    });
  });

  describe('stop command', () => {
    test('should handle stop when not running', async () => {
      fs.existsSync.mockReturnValue(false);
      
      await expect(DaemonCommand.stop(mockOptions, mockGlobalOptions)).resolves.not.toThrow();
      expect(process.kill).not.toHaveBeenCalled();
    });

    test('should handle JSON output when not running', async () => {
      const jsonOptions = { ...mockGlobalOptions, json: true };
      fs.existsSync.mockReturnValue(false);
      
      await expect(DaemonCommand.stop(mockOptions, jsonOptions)).resolves.not.toThrow();
    });
  });
});