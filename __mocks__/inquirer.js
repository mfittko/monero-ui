// Mock inquirer module
module.exports = {
  prompt: jest.fn().mockResolvedValue({ confirm: true, action: 'reset' }),
  createPromptModule: jest.fn().mockReturnValue(jest.fn().mockResolvedValue({ confirm: true }))
};