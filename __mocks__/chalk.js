// Mock chalk module
const mockChalk = {
  red: jest.fn((text) => text),
  green: jest.fn((text) => text),
  blue: jest.fn((text) => text),
  yellow: jest.fn((text) => text),
  cyan: jest.fn((text) => text),
  magenta: jest.fn((text) => text),
  gray: jest.fn((text) => text),
  white: jest.fn((text) => text),
  bold: jest.fn((text) => text)
};

// Add nested properties for chained calls
mockChalk.green.bold = jest.fn((text) => text);
mockChalk.red.bold = jest.fn((text) => text);

module.exports = mockChalk;