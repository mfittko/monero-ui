# XMRig Web UI

A modern React-based web dashboard for monitoring XMRig mining statistics with real-time charts and detailed system information.

## Prerequisites

- XMRig running with HTTP API enabled (port 8080)
- Node.js (version 20.19.4 or higher) - LTS version locked
- npm package manager (version 10.0.0 or higher)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Command Line Interface (CLI)

XMRig Web UI provides a comprehensive CLI for managing the application:

```bash
# Install the CLI globally (recommended)
npm install -g .

# Or use directly from project directory
./bin/xmrig-ui [command]
```

#### Basic Commands

```bash
# Start the application
xmrig-ui start

# Start as background daemon
xmrig-ui start --daemon

# Stop the daemon
xmrig-ui stop

# Check status
xmrig-ui status

# Restart the service
xmrig-ui restart
```

#### Autostart Management

```bash
# Enable autostart on system boot
xmrig-ui autostart enable

# Disable autostart
xmrig-ui autostart disable

# Check autostart status
xmrig-ui autostart status

# Enable with custom settings
xmrig-ui autostart enable --port 8080 --delay 15
```

#### Configuration Management

```bash
# Show current configuration
xmrig-ui config show

# Interactive configuration editor
xmrig-ui config edit

# Reset to defaults
xmrig-ui config reset
```

#### Application Management

```bash
# Install desktop shortcuts/app bundles
xmrig-ui install

# View logs
xmrig-ui logs

# Follow logs in real-time
xmrig-ui logs --follow

# Clear logs
xmrig-ui logs --clear

# Uninstall completely
xmrig-ui uninstall
```

#### Global Options

```bash
# JSON output (machine-readable)
xmrig-ui status --json

# Quiet mode (minimal output)
xmrig-ui start --quiet

# Verbose mode (detailed output)
xmrig-ui start --verbose

# Help for any command
xmrig-ui --help
xmrig-ui autostart --help
```

### Development Mode
1. Make sure XMRig is running with HTTP API enabled on port 8080
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open your browser and go to: http://localhost:5173

### Production Build
1. Build the application:
   ```bash
   npm run build
   ```
2. Serve the built files from the `dist` directory with any web server

### Legacy NPM Scripts (Backward Compatibility)

```bash
# Start the daemon (builds and serves on port 4173)
npm run start-daemon

# Check daemon status
npm run status-daemon

# Stop the daemon
npm run stop-daemon
```

The daemon automatically:
- Builds the project
- Starts a production server on port 4173
- Runs as a background process (detached)
- Prevents multiple instances (singleton)
- Logs to system temp directory
- Opens browser automatically (on supported platforms)

### App Installation
Install as a native app shortcut on macOS or Linux:

```bash
npm run install-app
```

This creates:
- **macOS**: App bundle in Applications folder
- **Linux**: Desktop entry in applications menu

## How to Use the Dashboard

### Main Dashboard Interface

1. **Auto-refresh**: The dashboard automatically updates every 5 seconds
2. **Status Overview**: Top section shows mining status, uptime, and current hashrate
3. **Tabbed Interface**: Navigate between different sections using tabs

### Dashboard Sections

#### 1. Overview Tab
- **Mining Status**: Active/Inactive, algorithm, version
- **Performance Metrics**: Current hashrate, highest hashrate, shares
- **System Load**: CPU usage and memory consumption
- **Uptime**: How long XMRig has been running

#### 2. System Info Tab
- **CPU Details**: Brand, architecture, cores, threads, L3 cache
- **Memory**: Total RAM, current usage with visual progress bar
- **GPU Support**: Automatic detection of CUDA/OpenCL capabilities
- **System Load**: Real-time load average

#### 3. Pool Info Tab
- **Connection Details**: Pool address, resolved IP, ping time
- **Mining Info**: Difficulty, algorithm, worker ID
- **Share Statistics**: Accepted/total shares with percentage
- **Performance**: Average time between shares

#### 4. Threads Tab
- **Thread Performance**: Visual bar chart showing hashrate per thread
- **Individual Metrics**: Detailed per-thread statistics
- **Performance Comparison**: Easy identification of underperforming threads

### Visual Indicators

- **🟢 Green**: Good performance, normal operation
- **🟡 Yellow**: Warning conditions, suboptimal performance  
- **🔴 Red**: Error conditions, connection issues
- **📊 Charts**: Interactive hover for detailed information

### Troubleshooting

- **No Data**: Check XMRig API connection on port 8080
- **Connection Error**: Verify XMRig HTTP API is enabled
- **Performance Issues**: Check individual thread performance in Threads tab

## Autostart Configuration

XMRig Web UI supports automatic startup on system boot for seamless monitoring:

### Supported Platforms

- **Linux**: systemd user services (Ubuntu, CentOS, Fedora, etc.)
- **macOS**: launchd agents (macOS 10.14+)
- **Windows**: Not yet implemented (use Task Scheduler manually)

### Quick Setup

1. **Enable autostart**:
   ```bash
   xmrig-ui autostart enable
   ```

2. **Configure startup delay** (optional):
   ```bash
   xmrig-ui autostart enable --delay 30  # Wait 30 seconds after boot
   ```

3. **Verify configuration**:
   ```bash
   xmrig-ui autostart status
   ```

### Advanced Configuration

The autostart feature creates platform-specific service files:

- **Linux**: `~/.config/systemd/user/xmrig-web-ui.service`
- **macOS**: `~/Library/LaunchAgents/xmrig-web-ui.plist`

These services are configured to:
- Start automatically after user login
- Restart on failure
- Log to system journals
- Run with appropriate permissions

### Manual Service Management

For advanced users who prefer manual control:

```bash
# Linux (systemd)
systemctl --user enable xmrig-web-ui.service
systemctl --user start xmrig-web-ui.service
systemctl --user status xmrig-web-ui.service

# macOS (launchd)
launchctl load ~/Library/LaunchAgents/xmrig-web-ui.plist
launchctl start com.xmrig.webui
launchctl list | grep xmrig
```

## Configuration Management

### Configuration File

XMRig Web UI stores configuration in `~/.xmrig-ui/config.json`:

```json
{
  "server": {
    "port": 4173,
    "host": "0.0.0.0"
  },
  "xmrig": {
    "apiUrl": "http://localhost:8080",
    "refreshInterval": 5000
  },
  "ui": {
    "theme": "dark",
    "autoRefresh": true,
    "showSystemInfo": true
  },
  "logging": {
    "level": "info",
    "file": "/tmp/xmrig-web-ui.log",
    "maxSize": "10MB",
    "rotate": true
  }
}
```

### Environment Variables

Override configuration with environment variables:

```bash
export XMRIG_UI_PORT=8080
export XMRIG_UI_API_URL=http://192.168.1.100:8080
xmrig-ui start
```

## Features

- **Real-time Dashboard**: Auto-refreshing every 5 seconds
- **Comprehensive Mining Stats**:
  - Mining status and uptime
  - Current and highest hashrate
  - Algorithm and version information
  - Donate level and pause status
- **System Information**:
  - CPU details (brand, cores, threads, L3 cache)
  - Memory usage with visual indicator
  - GPU support detection (CUDA/OpenCL)
  - System load average
- **Pool Connection Details**:
  - Pool address and IP
  - Connection ping and difficulty
  - Share statistics (accepted/total)
  - Average share time
- **Visual Charts**:
  - Thread performance bar chart
  - Memory usage visualization
- **Modern UI**: Clean, dark theme interface with responsive design
- **Daemon Mode**: Background service with singleton process management
- **App Integration**: Native app shortcuts for macOS and Linux

## Configuration

The web UI connects to XMRig's HTTP API on `localhost:8080` through Vite's proxy configuration. The development server runs on port 5173, while the daemon mode uses port 4173.

To change the XMRig API port, edit the proxy configuration in `vite.config.js`:

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080', // Change this port if needed
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '/1')
    }
  }
}
```

## XMRig API Setup

Ensure XMRig is configured with HTTP API enabled. Add this to your XMRig configuration:

```json
{
  "http": {
    "enabled": true,
    "host": "127.0.0.1",
    "port": 8080,
    "access-token": null,
    "restricted": true
  }
}
```

## Node.js Version Management

This project uses Node.js LTS version 20.19.4. If you use nvm:

```bash
# Install and use the correct Node.js version
nvm install
nvm use
```

The `.nvmrc` file ensures consistent Node.js versions across development environments.
