import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hotel Rate Aggregator - Syafar Tour',
  description: 'Internal tool untuk mencari harga hotel dan membuat quotation paket umrah/haji',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}