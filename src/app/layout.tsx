import type { Metadata, Viewport } from 'next';
import './globals.css';

const bp = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const metadata: Metadata = {
  title: 'Lark — a couples city adventure',
  description: 'Explore a 3D city together. Reunite, or race the clock to find landmarks.',
  manifest: `${bp}/manifest.webmanifest`,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3a7ca5',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
