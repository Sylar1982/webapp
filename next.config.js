/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.NODE_ENV === 'production' ? '/webapp' : '',
  output: 'standalone',
  images: {
    unoptimized: true
  }
};

module.exports = nextConfig; 