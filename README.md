# XMRig Web UI

A modern React-based web dashboard for monitoring XMRig mining statistics with real-time charts and detailed system information.

## Prerequisites

- XMRig running with HTTP API enabled (port 8080)
- Node.js (version 14 or higher)
- npm package manager

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

## Configuration

The web UI connects to XMRig's HTTP API on `localhost:8080` through Vite's proxy configuration. The development server runs on port 5173.

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
