import * as React from 'react';
import type { Metadata } from 'next';
import { EnvProvider } from '@/context/EnvContext';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Digest',
  description: 'Cross-platform ebook reader',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <head>
        <meta
          name='viewport'
          content='width=device-width, height=device-height, initial-scale=1 maximum-scale=1'
        />
      </head>
      <body>
        <EnvProvider>
          <AuthProvider>{children}</AuthProvider>
        </EnvProvider>
      </body>
    </html>
  );
}
