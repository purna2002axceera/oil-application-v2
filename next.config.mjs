/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable strict mode to prevent double-rendering issues in Electron
  reactStrictMode: false,
  
  // Disable SWC minification which can cause issues in Electron
  swcMinify: true,
  
  // Disable image optimization for Electron (requires external service)
  images: {
    unoptimized: true,
  },
  
  // Important: Allow localhost and electron protocols
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
  
  // Optimize for production build
  compiler: {
    removeConsole: false, // Keep console logs for debugging
  },
  
  // Ensure all assets are properly loaded
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
};

export default nextConfig;