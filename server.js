// peek-test-api — zero-dependency HTTP service used to verify peek.dev's
// multi-repo mounts: the preview pipeline starts this repo's `npm start` on
// an offset loopback port (primary entry port + 100) and the primary app
// proxies /api to it. The port must come from PORT (the pipeline retargets
// the command by prepending PORT=<offset>).
const http = require('http');
const net = require('net');

// Redis is a hard dependency from this change on: /api/redis PINGs it over RESP.
const REDIS_URL = new URL(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

function redisPing() {
  return new Promise((resolve, reject) => {
    const sock = net.connect(Number(REDIS_URL.port || 6379), REDIS_URL.hostname);
    sock.setTimeout(2000, () => { sock.destroy(); reject(new Error('redis timeout')); });
    sock.on('error', reject);
    sock.on('data', (buf) => { sock.end(); resolve(buf.toString().trim()); });
    sock.write('*1\r\n$4\r\nPING\r\n');
  });
}

const PORT = Number(process.env.PORT || 3001);

function json(res, code, body) {
  const payload = JSON.stringify(body);
  res.writeHead(code, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  if (req.method === 'GET' && url.pathname === '/api/hello') {
    return json(res, 200, {
      ok: true,
      service: 'peek-test-api',
      message: 'hello from the mounted repo',
      port: PORT,
      pid: process.pid,
      mountedFrom: process.env.PEEK_REPO_JOLLYPROCESS722_PEEK_TEST_API || null,
      ts: new Date().toISOString(),
    });
  }
  if (req.method === 'GET' && url.pathname === '/api/redis') {
    redisPing()
      .then((reply) => json(res, 200, { ok: reply === '+PONG', reply }))
      .catch((err) => json(res, 503, { ok: false, error: String(err.message || err) }));
    return;
  }
  if (req.method === 'GET' && url.pathname === '/') {
    return json(res, 200, { service: 'peek-test-api', endpoints: ['/api/hello'], port: PORT });
  }
  return json(res, 404, { error: 'not found', path: url.pathname });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`peek-test-api listening on port ${PORT}`);
});
