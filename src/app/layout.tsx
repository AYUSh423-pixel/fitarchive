import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { Epilogue, Manrope } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/AppShell';

const epilogue = Epilogue({
  variable: '--font-epilogue',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'NutriFit AI — Personal Dietitian & Body Transformation',
  description:
    'Warm, beginner-friendly personal AI dietitian for pure-vegetarian Indian nutrition, meal scanning, workouts, and body transformation.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FB923C',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${epilogue.variable} ${manrope.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#F7F4EF] text-[#1B1B1E]">
        <Suspense fallback={<div className="min-h-screen bg-[#F7F4EF]" />}>
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
