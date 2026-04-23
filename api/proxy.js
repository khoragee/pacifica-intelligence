const https = require('https');

const PACIFICA_BASE = process.env.USE_TESTNET === 'true'
  ? 'https://test-api.pacifica.fi'
  : 'https://api.pacifica.fi';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const pathSegment = Array.isArray(req.query.path)
    ? req.query.path.join('/')
    : (req.query.path || '');

  const qs = new URLSearchParams(req.query);
  qs.delete('path');
  const queryString = qs.toString();

  const upstreamHost = PACIFICA_BASE.replace('https://', '');
  const upstreamPath = `/api/v1/${pathSegment}${queryString ? '?' + queryString : ''}`;

  return new Promise((resolve) => {
    const isPost = req.method === 'POST';
    const body = isPost ? JSON.stringify(req.body || {}) : null;

    const options = {
      hostname: upstreamHost,
      path: upstreamPath,
      method: req.method,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PacificaIntelligence/1.0',
        ...(isPost && { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }),
      },
      timeout: 9000,
    };

    const proxyReq = https.request(options, (proxyRes) => {
      const chunks = [];
      proxyRes.on('data', d => chunks.push(d));
      proxyRes.on('end', () => {
        res.setHeader('Content-Type', 'application/json');
        res.status(proxyRes.statusCode).send(Buffer.concat(chunks).toString());
        resolve();
      });
    });

    proxyReq.on('error', (e) => {
      res.status(502).json({ success: false, error: 'upstream_error', message: e.message });
      resolve();
    });

    proxyReq.on('timeout', () => {
      proxyReq.destroy();
      res.status(504).json({ success: false, error: 'timeout' });
      resolve();
    });

    if (isPost && body) proxyReq.write(body);
    proxyReq.end();
  });
};
