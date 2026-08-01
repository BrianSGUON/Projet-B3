import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      '@': __dirname,
    },
  },
}

export default nextConfig
