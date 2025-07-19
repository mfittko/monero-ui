import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import './App.css';

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/summary');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError('Error fetching data');
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!data) {
    return <div className="loading">Loading...</div>;
  }

  const memoryUsage = 100 - ((data.resources.memory.free / data.resources.memory.total) * 100);
  const threadChartData = data.hashrate.threads.map((thread, index) => ({
    name: `T${index + 1}`,
    hashrate: thread[0] || 0,
  }));
  
  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };
  
  const formatMemory = (bytes) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  return (
    <div className="container">
      <div className="header">
        <h1>XMRig Miner Stats</h1>
        <p>Real-time mining data display</p>
      </div>

      <div className="grid">
        <div className="card">
          <h3>🔧 Mining Status</h3>
          <div className="stat">
            <span className="label">Status</span>
            <span className="value">
              <span className={`status-indicator ${data.paused ? 'status-offline' : 'status-online'}`}></span>
              {data.paused ? 'Paused' : 'Mining'}
            </span>
          </div>
          <div className="stat">
            <span className="label">Uptime</span>
            <span className="value">{formatUptime(data.uptime)}</span>
          </div>
          <div className="stat">
            <span className="label">Algorithm</span>
            <span className="value">{data.algo}</span>
          </div>
          <div className="stat">
            <span className="label">Version</span>
            <span className="value">{data.version}</span>
          </div>
          <div className="stat">
            <span className="label">Donate Level</span>
            <span className="value">{data.donate_level}%</span>
          </div>
        </div>

        <div className="card">
          <h3>⚡ Performance</h3>
          <div className="stat">
            <span className="label">Current Hashrate</span>
            <span className="value hashrate-large">{data.hashrate.total[0].toFixed(2)} H/s</span>
          </div>
          <div className="stat">
            <span className="label">Highest Hashrate</span>
            <span className="value">{data.hashrate.highest.toFixed(2)} H/s</span>
          </div>
          <div className="stat">
            <span className="label">Load Average</span>
            <span className="value">{data.resources.load_average[0].toFixed(2)}</span>
          </div>
          <div className="stat">
            <span className="label">Active Threads</span>
            <span className="value">{data.hashrate.threads.length}</span>
          </div>
        </div>

        <div className="card">
          <h3>💾 System Info</h3>
          <div className="stat">
            <span className="label">CPU</span>
            <span className="value">{data.cpu.brand}</span>
          </div>
          <div className="stat">
            <span className="label">Cores/Threads</span>
            <span className="value">{data.cpu.cores}/{data.cpu.threads}</span>
          </div>
          <div className="stat">
            <span className="label">L3 Cache</span>
            <span className="value">{(data.cpu.l3 / (1024 * 1024)).toFixed(1)} MB</span>
          </div>
          <div className="stat">
            <span className="label">Total Memory</span>
            <span className="value">{formatMemory(data.resources.memory.total)}</span>
          </div>
          <div className="memory-bar">
            <div className="memory-fill" style={{ width: `${memoryUsage}%` }}></div>
          </div>
          <div className="stat">
            <span className="label">Memory Usage</span>
            <span className="value">{memoryUsage.toFixed(1)}%</span>
          </div>
          <div className="stat">
            <span className="label">GPU Support</span>
            <span className="value">
              {data.features.includes('cuda') ? '🎮 CUDA' : ''}
              {data.features.includes('opencl') ? '🎮 OpenCL' : ''}
              {!data.features.includes('cuda') && !data.features.includes('opencl') ? 'CPU Only' : ''}
            </span>
          </div>
        </div>

        <div className="card">
          <h3>🌐 Pool Connection</h3>
          <div className="stat">
            <span className="label">Pool</span>
            <span className="value">{data.connection.pool}</span>
          </div>
          <div className="stat">
            <span className="label">IP Address</span>
            <span className="value">{data.connection.ip}</span>
          </div>
          <div className="stat">
            <span className="label">Ping</span>
            <span className="value">{data.connection.ping} ms</span>
          </div>
          <div className="stat">
            <span className="label">Difficulty</span>
            <span className="value">{data.connection.diff.toLocaleString()}</span>
          </div>
          <div className="stat">
            <span className="label">Shares (Good/Total)</span>
            <span className="value">{data.connection.accepted}/{data.results.shares_total}</span>
          </div>
          <div className="stat">
            <span className="label">Avg Share Time</span>
            <span className="value">{data.connection.avg_time}s</span>
          </div>
        </div>

        <div className="card chart-container">
          <h3>📊 Thread Performance</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={threadChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
              <XAxis dataKey="name" stroke="#8b949e" />
              <YAxis stroke="#8b949e" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#21262d', 
                  border: '1px solid #30363d',
                  borderRadius: '6px',
                  color: '#f0f6fc'
                }}
              />
              <Bar dataKey="hashrate" fill="#58a6ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}

export default App;
