/** @type {import('next').NextConfig} */

// Deploy targets:
//  - Vercel (default): builds Next natively and serves at the domain root.
//  - GitHub Pages: set STATIC_EXPORT=1 and NEXT_PUBLIC_BASE_PATH=/<repo> to emit
//    a static ./out served from https://<user>.github.io/<repo>/.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const staticExport = process.env.STATIC_EXPORT === '1' || process.env.STATIC_EXPORT === 'true';

const nextConfig = {
  ...(staticExport ? { output: 'export' } : {}),
  reactStrictMode: false,
  transpilePackages: ['three'],
  eslint: { ignoreDuringBuilds: true },
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
};

export default nextConfig;
