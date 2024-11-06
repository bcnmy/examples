'use client';

import { IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { useMarketStore } from './stores/marketStore';

export const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isBullish = useMarketStore(state => state.isBullish);
  
  const bgColor = isBullish === null 
    ? 'bg-slate-900'
    : isBullish 
    ? 'bg-green-950' 
    : 'bg-red-950';

  return (
    <html lang="en">
      <body className={`${ibmPlexMono.className} ${bgColor} text-slate-200 transition-colors duration-300 bg-black bg-circuit-pattern min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
