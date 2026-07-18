// server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Allow CORS for your GitHub Pages origin
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
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
  selfHandleResponse: true, // We handle response to forward cookies
  onProxyReq: (proxyReq, req) => {
    // Forward cookies from browser to API
    if (req.headers.cookie) proxyReq.setHeader('cookie', req.headers.cookie);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Forward set-cookie from API to browser
    const cookies = proxyRes.headers['set-cookie'];
    if (cookies) {
      cookies.forEach(c => res.setHeader('Set-Cookie', c));
    }
    // Forward response body
    let body = '';
    proxyRes.on('data', chunk => body += chunk);
    proxyRes.on('end', () => {
      res.set(proxyRes.headers);
      res.status(proxyRes.statusCode).send(body);
    });
  },
}));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Proxy running on ${port}`));
