/** @type {import('next').NextConfig} */
const path = require('node:path');

const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '..', '..'),
  async rewrites() {
    // In production, proxy /api/* requests to the backend so that cookies
    // are set on the same domain as the frontend. In development the
    // frontend calls the API directly (no rewrite needed).
    const backendUrl = process.env.API_BACKEND_URL?.trim();
    if (!backendUrl) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl.replace(/\/+$/, '')}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
