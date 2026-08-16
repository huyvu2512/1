const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = 3000;
const ROOT = path.join(__dirname);

process.on('uncaughtException', (err) => {
  console.error('[Server Error Handler]', err.message);
});

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function resolveUrl(urlPath, baseUrl, origin) {
  let resolved = urlPath;
  if (!urlPath.startsWith('http://') && !urlPath.startsWith('https://')) {
    if (urlPath.startsWith('/')) {
      resolved = `${origin}${urlPath}`;
    } else {
      resolved = `${baseUrl}${urlPath}`;
    }
  }
  return resolved;
}

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

      if (proxyRes.statusCode >= 400) {
        if (!res.headersSent) {
          res.writeHead(proxyRes.statusCode, {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'text/plain; charset=utf-8'
          });
          res.end(`Upstream Error: HTTP ${proxyRes.statusCode}`);
        }
        return;
      }

      const resHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Content-Type': proxyRes.headers['content-type'] || 'application/octet-stream'
      };

      const contentType = proxyRes.headers['content-type'] || '';
      const isMpd = contentType.includes('dash+xml') || targetUrl.includes('.mpd');
      const isM3u8 = contentType.includes('mpegurl') || targetUrl.includes('.m3u8');

      if (isMpd) {
        let body = '';
        proxyRes.setEncoding('utf8');
        proxyRes.on('data', (chunk) => { body += chunk; });
        proxyRes.on('end', () => {
          if (!res.headersSent) {
            const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
            body = body
              .replace(/\binitialization="(?!https?:\/\/)([^"]+)"/g, `initialization="${baseUrl}$1"`)
              .replace(/\bmedia="(?!https?:\/\/)([^"]+)"/g, `media="${baseUrl}$1"`);

            res.writeHead(200, resHeaders);
            res.end(body);
          }
        });
      } else if (isM3u8) {
        let body = '';
        proxyRes.setEncoding('utf8');
        proxyRes.on('data', (chunk) => { body += chunk; });
        proxyRes.on('end', () => {
          if (!res.headersSent) {
            const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
            const origin = urlObj.origin;
            const lines = body.split(/\r?\n/);

            const rewritten = lines.map((line) => {
              const trimmed = line.trim();
              if (!trimmed) return line;

              if (trimmed.startsWith('#')) {
                return trimmed.replace(/URI="([^"]+)"/g, (match, p1) => {
                  const abs = resolveUrl(p1, baseUrl, origin);
                  return `URI="/api/stream?url=${encodeURIComponent(abs)}"`;
                });
              }

              if (trimmed.includes('.m3u8')) {
                const abs = resolveUrl(trimmed, baseUrl, origin);
                return `/api/stream?url=${encodeURIComponent(abs)}`;
              }

              // Ts / M4s video chunks: resolve to absolute CDN URL
              return resolveUrl(trimmed, baseUrl, origin);
            });

            res.writeHead(200, {
              ...resHeaders,
              'Content-Type': 'application/vnd.apple.mpegurl'
            });
            res.end(rewritten.join('\n'));
          }
        });
      } else {
        if (!res.headersSent) {
          res.writeHead(proxyRes.statusCode, resHeaders);
          proxyRes.pipe(res);
        }
      }
    });

    proxyReq.on('error', (err) => {
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
        res.end(`Nguồn phát không phản hồi (${err.code || err.message})`);
      }
    });
  } catch (e) {
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      res.end('Invalid URL');
    }
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

  if (parsedUrl.pathname === '/api/stream') {
    const targetUrl = parsedUrl.searchParams.get('url');
    if (!targetUrl) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing url param');
      return;
    }
    return handleStreamProxy(req, res, targetUrl);
  }

  let filePath = path.join(ROOT, parsedUrl.pathname === '/' ? 'index.html' : parsedUrl.pathname);
  const ext = path.extname(filePath).toLowerCase();

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (!res.headersSent) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
      }
      return;
    }
    if (!res.headersSent) {
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(data);
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 Dev Server & Streaming Proxy đang chạy tại: http://localhost:${PORT}`);
  console.log(`Đã tối ưu M3U8 / MPD Sub-playlist & Segment Resolver!\n`);
});
