// server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use((req, res, next) => {
  const origin = req.headers.origin || 'https://t0k-0.github.io';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.urlencoded({ extended: true }));

app.use('/', createProxyMiddleware({
  target: 'https://klubko.aeroklub-kolin.cz/rest-api/',
  changeOrigin: true,
  pathRewrite: { '^/rest-api': '' },
  selfHandleResponse: true,
  onProxyReq: (proxyReq, req) => {
    if (req.headers.cookie) proxyReq.setHeader('cookie', req.headers.cookie);
    if (req.body && Object.keys(req.body).length) {
      const bodyData = new URLSearchParams(req.body).toString();
      proxyReq.setHeader('Content-Type', 'application/x-www-form-urlencoded');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    const raw = proxyRes.rawHeaders;
    for (let i = 0; i < raw.length; i += 2) {
      const key = raw[i];
      const value = raw[i + 1];
      const lowerKey = key.toLowerCase();
      
      if (lowerKey === 'set-cookie') {
        // Add SameSite=None; Secure for cross-site cookie acceptance
        let cookie = value;
        if (!cookie.includes('SameSite')) {
          cookie += '; SameSite=None; Secure';
        }
        res.setHeader(key, cookie);
      } else if (lowerKey !== 'transfer-encoding' && lowerKey !== 'content-length') {
        res.setHeader(key, value);
      }
    }
    proxyRes.pipe(res);
  },
}));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Proxy running on ${port}`));
