# XMRig Web UI

A simple web interface for monitoring XMRig mining statistics.

## Prerequisites

- XMRig running with HTTP API enabled (port 8080)
- Python 3 installed

## Usage

1. Make sure XMRig is running with HTTP API enabled on port 8080
2. Start the web server:
   ```bash
   python3 server.py
   ```
3. Open your browser and go to: http://localhost:8081

## Features

- Real-time mining statistics
- Auto-refresh every 5 seconds
- Shows:
  - Uptime
  - Current hashrate
  - Accepted/rejected shares
  - Pool connection info

## Configuration

The web UI connects to XMRig's API on `localhost:8080` and serves the interface on port `8081`.

To change ports, edit the `PORT` variable in `server.py` and update your XMRig configuration if needed.
