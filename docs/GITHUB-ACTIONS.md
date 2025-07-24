# GitHub Actions CI/CD Pipeline

This repository includes automated continuous integration and deployment using GitHub Actions.

## Workflows

### CI Pipeline (`.github/workflows/ci.yml`)

The CI pipeline runs on every push and pull request to `main` and `develop` branches and includes:

#### 1. Test & Lint Job
- **Node.js Setup**: Uses Node.js 20.x (LTS) with npm caching
- **Dependency Installation**: Runs `npm ci` for clean, reproducible builds
- **Linting**: Executes ESLint to check code quality and consistency
- **Testing**: Runs Jest test suite with coverage reporting
- **Coverage Upload**: Uploads coverage reports to Codecov for analysis

#### 2. Build Job
- **Dependency Installation**: Fresh npm install
- **Application Build**: Runs Vite build process to create production artifacts
- **Artifact Upload**: Stores build files as GitHub Actions artifacts (retained for 7 days)

#### 3. Security Job
- **Security Audit**: Runs npm audit to check for vulnerable dependencies
- **Configurable Severity**: Currently set to moderate level and above

## Configuration Details

### ESLint Configuration
- **Framework**: Uses ESLint 9.x with flat config format
- **React Support**: Includes React and React Hooks plugins
- **Coverage**: Covers JavaScript/JSX files, CLI commands, services, and tests
- **Rules**: Enforces consistent coding style with semicolons and single quotes

### Jest Testing
- **Coverage Threshold**: Configured for 80% coverage across all metrics
- **Test Environment**: Node.js environment for CLI testing
- **Coverage Reports**: Generates LCOV, HTML, and text formats
- **File Patterns**: Tests CLI commands, services, and React components

### Build Process
- **Technology**: Uses Vite for fast, modern bundling
- **Output**: Creates optimized production build in `dist/` directory
- **Features**: Includes React hot reload and development proxy setup

## Running Locally

```bash
# Install dependencies
npm install

# Run linting
npm run lint
npm run lint:fix  # Auto-fix issues

# Run tests
npm test
npm run test:coverage  # With coverage report
npm run test:watch     # Watch mode

# Build application
npm run build
npm run preview        # Preview production build
```

## Coverage Reports

Test coverage reports are automatically generated and uploaded to Codecov. You can view detailed coverage information:

- **Local**: Open `coverage/index.html` after running `npm run test:coverage`
- **CI**: Coverage data is uploaded to Codecov on every CI run
- **Thresholds**: Currently set to 80% for statements, branches, functions, and lines

## Troubleshooting

### Common Issues

1. **Linting Failures**: Run `npm run lint:fix` to auto-fix common issues
2. **Test Failures**: Check mock configurations in test files
3. **Build Failures**: Ensure all dependencies are properly installed
4. **Coverage Below Threshold**: Add tests for uncovered code paths

### CI Debug

To debug CI issues:
1. Check the Actions tab in GitHub repository
2. Review individual job logs for specific errors
3. Run the same commands locally to reproduce issues
4. Ensure all required environment variables are set