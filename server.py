#!/usr/bin/env python3
import http.server
import socketserver
import urllib.request
import json
from urllib.parse import urlparse
import os

PORT = 8081

class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/api/'):
            # Proxy API requests to XMRig
            xmrig_path = self.path.replace('/api/', '/1/')
            xmrig_url = f"http://localhost:8080{xmrig_path}"
            
            try:
                with urllib.request.urlopen(xmrig_url) as response:
                    data = response.read()
                    
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(data)
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
        else:
            # Serve static files
            super().do_GET()

if __name__ == "__main__":
    os.chdir('/home/deiner/git/xmrig-web-ui')
    with socketserver.TCPServer(("", PORT), ProxyHandler) as httpd:
        print(f"Server running at http://localhost:{PORT}")
        print("Press Ctrl+C to stop")
        httpd.serve_forever()
