/** @type {import('next').NextConfig} */
const path = require('node:path');
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '..', '..'),
  async rewrites() {
    const rawBackend =
      process.env.API_BACKEND_URL?.trim() ||
      (process.env.NEXT_PUBLIC_API_URL?.startsWith('http')
        ? process.env.NEXT_PUBLIC_API_URL.trim()
        : '');

    if (!rawBackend) return [];

    const cleanBackend = rawBackend.replace(/\/+$/, '');
    const destinationBase = cleanBackend.endsWith('/api')
      ? cleanBackend
      : `${cleanBackend}/api`;

    return [
      {
        source: '/api/:path*',
        destination: `${destinationBase}/:path*`,
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
