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

### Production Daemon Mode (Recommended)
Run the application as a background daemon with singleton process management:

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
