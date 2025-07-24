// Jest setup file - comprehensive mocking setup
// Mock all UI and system modules before any tests run

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
process.exit = jest.fn();
process.kill = jest.fn().mockReturnValue(true);

// Mock all problematic modules
jest.mock('ora', () => {
  const mockSpinner = {
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis(),
    text: '',
    color: 'cyan'
  };
  return jest.fn(() => mockSpinner);
});

jest.mock('inquirer', () => ({
  prompt: jest.fn().mockResolvedValue({ confirm: true, action: 'reset' })
}));

jest.mock('child_process', () => ({
  spawn: jest.fn(() => ({
    on: jest.fn((event, callback) => {
      if (event === 'exit') setTimeout(() => callback(0), 10);
    }),
    unref: jest.fn(),
    disconnect: jest.fn(),
    kill: jest.fn(),
    pid: 12345,
    stdout: { on: jest.fn() },
    stderr: { on: jest.fn() }
  })),
  execSync: jest.fn(() => 'mock output'),
  exec: jest.fn()
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
  readdirSync: jest.fn(),
  statSync: jest.fn(),
  mkdirSync: jest.fn(),
  accessSync: jest.fn(),
  constants: { F_OK: 0, R_OK: 4, W_OK: 2, X_OK: 1 }
}));

jest.mock('open', () => jest.fn().mockResolvedValue(undefined));

jest.mock('chalk', () => {
  const mockFunc = jest.fn(text => text);
  const chalk = {
    red: mockFunc, green: mockFunc, blue: mockFunc, yellow: mockFunc,
    cyan: mockFunc, magenta: mockFunc, gray: mockFunc, white: mockFunc, bold: mockFunc
  };
  chalk.green.bold = mockFunc;
  chalk.red.bold = mockFunc;
  chalk.yellow.bold = mockFunc;
  return chalk;
});

jest.mock('boxen', () => jest.fn((content) => content));