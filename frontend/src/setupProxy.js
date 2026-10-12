const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

module.exports = function configureProxy(app) {
  const backendPort = process.env.BACKEND_PORT || 3001;
  app.use(
    '/api',
    createProxyMiddleware({
      target: `http://127.0.0.1:${backendPort}`,
      changeOrigin: true,
    })
  );
};
