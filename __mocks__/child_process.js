// Mock child_process module
const mockChild = {
  on: jest.fn((event, callback) => {
    if (event === 'exit') {
      // Simulate successful exit after a short delay
      setTimeout(() => callback(0), 10);
    }
  }),
  unref: jest.fn(),
  disconnect: jest.fn(),
  kill: jest.fn(),
  pid: 12345,
  stdout: { on: jest.fn() },
  stderr: { on: jest.fn() }
};

module.exports = {
  spawn: jest.fn(() => mockChild),
  execSync: jest.fn().mockReturnValue('mock output'),
  exec: jest.fn((cmd, opts, callback) => {
    if (callback) callback(null, 'mock output', '');
    return mockChild;
  }),
  fork: jest.fn(() => mockChild)
};