// Jest setup file
// Add global test configurations here

// Mock console methods to reduce test output noise
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// Mock process methods to prevent actual system operations
const originalProcessExit = process.exit;
const originalProcessKill = process.kill;

process.exit = jest.fn();
process.kill = jest.fn().mockReturnValue(true);