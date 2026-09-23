import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Haffaf AI',
  description: 'Your intelligent AI assistant, developed by Haffaf.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
