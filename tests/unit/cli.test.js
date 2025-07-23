const { CLI } = require('../../lib/cli');
const { Command } = require('commander');

describe('CLI Class Unit Tests', () => {
  let cli;

  beforeEach(() => {
    cli = new CLI();
  });

  describe('Constructor', () => {
    test('should initialize CLI with commander program', () => {
      expect(cli.program).toBeInstanceOf(Command);
      expect(cli.program.name()).toBe('xmrig-ui');
    });

    test('should set correct program description', () => {
      expect(cli.program.description()).toContain('XMRig Web UI');
      expect(cli.program.description()).toContain('React-based monitoring dashboard');
    });

    test('should configure global options', () => {
      const opts = cli.program.options;
      const optionNames = opts.map(opt => opt.long);
      
      expect(optionNames).toContain('--json');
      expect(optionNames).toContain('--quiet');
      expect(optionNames).toContain('--verbose');
      expect(optionNames).toContain('--version');
      // Help option is configured differently in commander
    });
  });

  describe('Commands Registration', () => {
    test('should register all required commands', () => {
      const commands = cli.program.commands.map(cmd => cmd.name());
      
      expect(commands).toContain('start');
      expect(commands).toContain('stop');
      expect(commands).toContain('restart');
      expect(commands).toContain('status');
      expect(commands).toContain('autostart');
      expect(commands).toContain('config');
      expect(commands).toContain('logs');
      expect(commands).toContain('install');
      expect(commands).toContain('uninstall');
    });

    test('should configure start command with correct options', () => {
      const startCommand = cli.program.commands.find(cmd => cmd.name() === 'start');
      expect(startCommand).toBeDefined();
      
      const options = startCommand.options.map(opt => opt.long);
      expect(options).toContain('--port');
      expect(options).toContain('--host');
      expect(options).toContain('--daemon');
    });

    test('should configure autostart command with subcommands', () => {
      const autostartCommand = cli.program.commands.find(cmd => cmd.name() === 'autostart');
      expect(autostartCommand).toBeDefined();
      
      const subcommands = autostartCommand.commands.map(cmd => cmd.name());
      expect(subcommands).toContain('enable');
      expect(subcommands).toContain('disable');
      expect(subcommands).toContain('status');
    });
  });

  describe('Global Options', () => {
    test('should provide getGlobalOptions method', () => {
      expect(typeof cli.getGlobalOptions).toBe('function');
    });

    test('should handle version option', () => {
      const packageJson = require('../../package.json');
      expect(cli.program.version()).toBe(packageJson.version);
    });
  });

  describe('Help Configuration', () => {
    test('should configure custom help formatting', () => {
      expect(cli.program._helpConfiguration).toBeDefined();
      expect(cli.program._helpConfiguration.sortSubcommands).toBe(true);
    });
  });
});