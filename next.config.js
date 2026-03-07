/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/games/detonator',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
