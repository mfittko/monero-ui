// Mock fs module
module.exports = {
  existsSync: jest.fn().mockReturnValue(false),
  readFileSync: jest.fn().mockReturnValue('12345'),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
  readdirSync: jest.fn().mockReturnValue(['file1', 'file2']),
  statSync: jest.fn().mockReturnValue({ size: 1024 }),
  mkdirSync: jest.fn(),
  accessSync: jest.fn(),
  constants: {
    F_OK: 0,
    R_OK: 4,
    W_OK: 2,
    X_OK: 1
  }
};