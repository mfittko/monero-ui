// Jest setup file
// Add global test configurations here

// Mock console methods to reduce test output noise
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};