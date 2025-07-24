// Mock ora module
const mockSpinner = {
  start: jest.fn().mockReturnThis(),
  succeed: jest.fn().mockReturnThis(),
  fail: jest.fn().mockReturnThis(),
  stop: jest.fn().mockReturnThis(),
  text: '',
  color: 'cyan'
};

module.exports = jest.fn(() => mockSpinner);
// Also add named exports for different import styles
module.exports.default = jest.fn(() => mockSpinner);