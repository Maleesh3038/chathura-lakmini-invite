/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/wedding', destination: '/' },
      { source: '/wedding/admin', destination: '/admin' },
    ];
  },
};

module.exports = nextConfig;
