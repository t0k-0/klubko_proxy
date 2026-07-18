// klubko-proxy/server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use('/', createProxyMiddleware({
  target: 'https://klubko.aeroklub-kolin.cz',
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    // Forward cookies
    if (req.headers.cookie) proxyReq.setHeader('cookie', req.headers.cookie);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Forward set-cookie headers back to browser
    const cookies = proxyRes.headers['set-cookie'];
    if (cookies) res.setHeader('set-cookie', cookies);
  },
}));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Proxy running on ${port}`));
