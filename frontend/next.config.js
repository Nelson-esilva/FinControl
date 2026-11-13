/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Rotas da versão 1 → telas do FinControl 2.0
  async redirects() {
    return [
      { source: '/dashboard', destination: '/', permanent: false },
      { source: '/transactions', destination: '/lancamentos', permanent: false },
      { source: '/payable', destination: '/compromissos', permanent: false },
      { source: '/expenses', destination: '/compromissos', permanent: false },
      { source: '/budget', destination: '/orcamento', permanent: false },
      { source: '/wallet', destination: '/patrimonio', permanent: false },
    ]
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '*.onrender.com',
      },
      {
        protocol: 'https',
        hostname: '*.vercel.app',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
}

module.exports = nextConfig

