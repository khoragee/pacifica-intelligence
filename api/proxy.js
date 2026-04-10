// api/proxy.js
// Vercel Serverless Function — proxies all Pacifica REST calls
// Browser hits /api/v1/info → this forwards to https://api.pacifica.fi/api/v1/info

const https = require('https');

const PACIFICA_BASE = process.env.USE_TESTNET === 'true'
  ? 'https://test-api.pacifica.fi'
  : 'https://api.pacifica.fi';

module.exports = async (req, res) => {
  // CORS — allow browser to call this from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Reconstruct the Pacifica path from the captured route param + query string
  const path = req.query.path || '';
  const qs   = new URLSearchParams(req.query);
  qs.delete('path');
  const queryString = qs.toString();
  const upstreamUrl = `${PACIFICA_BASE}/api/v1/${path}${queryString ? '?' + queryString : ''}`;

  return new Promise((resolve) => {
    const options = new URL(upstreamUrl);
    const proxyReq = https.get({
      hostname: options.hostname,
      path:     options.pathname + options.search,
      headers: {
        'Accept':     'application/json',
        'User-Agent': 'PacificaIntelligence/1.0'
      },
      timeout: 9000
    }, (proxyRes) => {
      const chunks = [];
      proxyRes.on('data', d => chunks.push(d));
      proxyRes.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        res.setHeader('Content-Type', 'application/json');
        res.status(proxyRes.statusCode).send(body);
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
  });
};
