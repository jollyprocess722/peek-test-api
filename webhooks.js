// peek-test-api — inbound webhook routes (fixture for peek.dev A38/A39).
// Zero-dependency: registers POST routes in the same style the main
// server uses, with GitHub-style signature verification.
const crypto = require('crypto');

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || '';

function verifySignature(rawBody, signatureHeader) {
  if (!WEBHOOK_SECRET) return true; // dev mode: accept unverified deliveries
  const digest =
    'sha256=' + crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signatureHeader || ''));
  } catch {
    return false;
  }
}

const routes = [];
function post(path, handler) {
  routes.push({ path, handler });
}

// post('/webhook/github') — push and pull_request events from the App.
post('/webhook/github', (req, res, rawBody) => {
  if (!verifySignature(rawBody, req.headers['x-hub-signature-256'])) {
    res.writeHead(401);
    return res.end('bad signature');
  }
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ accepted: true, events: ['push', 'pull_request'] }));
});

// post('/webhook/ping') — installation ping handshake.
post('/webhook/ping', (req, res) => {
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ pong: true }));
});

module.exports = { routes, verifySignature, post };

