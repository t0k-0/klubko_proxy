// server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// CORS headers for your GitHub Pages origin
app.use((req, res, next) => {
  const origin = req.headers.origin || 'https://t0k-0.github.io';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use('/', createProxyMiddleware({
  target: 'https://klubko.aeroklub-kolin.cz',
  changeOrigin: true,
  selfHandleResponse: true, // CRITICAL: lets us forward Set-Cookie
  onProxyReq: (proxyReq, req) => {
    if (req.headers.cookie) proxyReq.setHeader('cookie', req.headers.cookie);
    // Forward body for POST
    if (req.body && Object.keys(req.body).length) {
      const bodyData = new URLSearchParams(req.body).toString();
      proxyReq.setHeader('Content-Type', 'application/x-www-form-urlencoded');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    // Forward ALL headers including Set-Cookie
    Object.entries(proxyRes.headers).forEach(([key, value]) => {
      if (key !== 'transfer-encoding') res.setHeader(key, value);
    });
    // Forward body
    let body = '';
    proxyRes.on('data', chunk => body += chunk);
    proxyRes.on('end', () => {
      res.status(proxyRes.statusCode).send(body);
    });
  },
}));

// Parse form data for login POST
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Proxy running on ${port}`));
