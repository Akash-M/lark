/** @type {import('next').NextConfig} */

// When deploying to a GitHub Pages *project* site the app is served from
// https://<user>.github.io/<repo>/ , so it needs a base path. The deploy
// workflow injects NEXT_PUBLIC_BASE_PATH (e.g. "/lark"). Locally it's
// empty, so the app runs at the root.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig = {
  output: 'export', // fully static site -> hostable on GitHub Pages
  reactStrictMode: false,
  transpilePackages: ['three'],
  eslint: { ignoreDuringBuilds: true },
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
};

export default nextConfig;
