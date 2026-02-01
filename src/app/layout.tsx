import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Detonator',
  description: 'Bomberman style maze warfare',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#1a1a2e]">{children}</body>
    </html>
  );
}
