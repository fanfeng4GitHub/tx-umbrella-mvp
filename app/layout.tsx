import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TX Umbrella MVP',
  description: 'Texas Real Estate Umbrella Insurance quote + issue MVP'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
