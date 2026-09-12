// peek-test-api — zero-dependency HTTP service used to verify peek.dev's
// multi-repo mounts: the preview pipeline starts this repo's `npm start` on
// an offset loopback port (primary entry port + 100) and the primary app
// proxies /api to it. The port must come from PORT (the pipeline retargets
// the command by prepending PORT=<offset>).
const http = require('http');

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
  if (req.method === 'GET' && url.pathname === '/') {
    return json(res, 200, { service: 'peek-test-api', endpoints: ['/api/hello'], port: PORT });
  }
  return json(res, 404, { error: 'not found', path: url.pathname });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`peek-test-api listening on port ${PORT}`);
});
