import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@entrebarras/types', '@entrebarras/utils'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com', // ExerciseDB GIFs
      },
    ],
  },
}

export default nextConfig
