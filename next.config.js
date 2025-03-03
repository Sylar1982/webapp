/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/webapp',
  images: {
    unoptimized: true
  }
};

module.exports = nextConfig; 