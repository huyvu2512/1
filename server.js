const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = 3000;
const ROOT = path.join(__dirname);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

async function handleStreamProxy(req, res, targetUrl) {
  try {
    const urlObj = new URL(targetUrl);
    const client = urlObj.protocol === 'https:' ? https : http;

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Origin': urlObj.origin,
      'Referer': `${urlObj.origin}/`
    };

    const proxyReq = client.get(targetUrl, { headers }, (proxyRes) => {
      // Follow redirect
      if ([301, 302, 303, 307, 308].includes(proxyRes.statusCode)) {
        const location = proxyRes.headers.location;
        if (location) {
          const redirectUrl = location.startsWith('http') ? location : new URL(location, targetUrl).href;
          return handleStreamProxy(req, res, redirectUrl);
        }
      }

      const resHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Content-Type': proxyRes.headers['content-type'] || 'application/octet-stream'
      };

      const contentType = proxyRes.headers['content-type'] || '';
      const isMpd = contentType.includes('dash+xml') || contentType.includes('xml') || targetUrl.includes('.mpd');
      const isM3u8 = contentType.includes('mpegurl') || targetUrl.includes('.m3u8');

      if (isMpd || isM3u8) {
        let body = '';
        proxyRes.setEncoding('utf8');
        proxyRes.on('data', (chunk) => { body += chunk; });
        proxyRes.on('end', () => {
          const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
          if (isMpd) {
            // Rewrite relative URLs in MPD
            body = body
              .replace(/\binitialization="(?!https?:\/\/)([^"]+)"/g, `initialization="${baseUrl}$1"`)
              .replace(/\bmedia="(?!https?:\/\/)([^"]+)"/g, `media="${baseUrl}$1"`);
          }
          res.writeHead(200, resHeaders);
          res.end(body);
        });
      } else {
        res.writeHead(proxyRes.statusCode, resHeaders);
        proxyRes.pipe(res);
      }
    });

    proxyReq.on('error', (err) => {
      console.error('Proxy request error:', err);
      res.writeHead(500, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
      res.end('Proxy Error: ' + err.message);
    });
  } catch (e) {
    console.error('Proxy Error:', e);
    res.writeHead(500, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
    res.end('Invalid URL');
  }
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    });
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);

  // API Proxy Stream
  if (parsedUrl.pathname === '/api/stream') {
    const targetUrl = parsedUrl.searchParams.get('url');
    if (!targetUrl) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing url param');
      return;
    }
    return handleStreamProxy(req, res, targetUrl);
  }

  // Static files
  let filePath = path.join(ROOT, parsedUrl.pathname === '/' ? 'index.html' : parsedUrl.pathname);
  const ext = path.extname(filePath).toLowerCase();

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 Dev Server & Streaming Proxy đang chạy tại: http://localhost:${PORT}`);
  console.log(`Đã tích hợp bộ giải mã CORS & MPD/HLS Stream Proxy!\n`);
});
