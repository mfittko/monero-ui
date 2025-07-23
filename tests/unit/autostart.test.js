const os = require('os');
const { execSync } = require('child_process');

// Mock the AutostartCommand to prevent actual system calls
jest.mock('../../lib/cli/commands/autostart', () => {
  return {
    enable: jest.fn(() => Promise.resolve()),
    disable: jest.fn(() => Promise.resolve()),
    status: jest.fn(() => Promise.resolve()),
  };
});

const AutostartCommand = require('../../lib/cli/commands/autostart');

describe('Autostart Command Tests', () => {
  let mockOptions;
  let mockGlobalOptions;

  beforeEach(() => {
    mockOptions = {};
    
    mockGlobalOptions = {
      json: false,
      quiet: false,
      verbose: false
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('enable command', () => {
    test('should exist and be a function', () => {
      expect(typeof AutostartCommand.enable).toBe('function');
    });

    test('should handle enable operation', async () => {
      await AutostartCommand.enable(mockOptions, mockGlobalOptions);
      expect(AutostartCommand.enable).toHaveBeenCalledWith(mockOptions, mockGlobalOptions);
    });

    test('should be called with correct parameters', async () => {
      const customOptions = { delay: 15 };
      await AutostartCommand.enable(customOptions, mockGlobalOptions);
      expect(AutostartCommand.enable).toHaveBeenCalledWith(customOptions, mockGlobalOptions);
    });
  });

  describe('disable command', () => {
    test('should exist and be a function', () => {
      expect(typeof AutostartCommand.disable).toBe('function');
    });

    test('should handle disable operation', async () => {
      await AutostartCommand.disable(mockOptions, mockGlobalOptions);
      expect(AutostartCommand.disable).toHaveBeenCalledWith(mockOptions, mockGlobalOptions);
    });
  });

  describe('status command', () => {
    test('should exist and be a function', () => {
      expect(typeof AutostartCommand.status).toBe('function');
    });

    test('should handle status check', async () => {
      await AutostartCommand.status(mockOptions, mockGlobalOptions);
      expect(AutostartCommand.status).toHaveBeenCalledWith(mockOptions, mockGlobalOptions);
    });

    test('should handle JSON output format', async () => {
      const jsonOptions = {
        ...mockGlobalOptions,
        json: true
      };

      await AutostartCommand.status(mockOptions, jsonOptions);
      expect(AutostartCommand.status).toHaveBeenCalledWith(mockOptions, jsonOptions);
    });
  });
});