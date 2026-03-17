import type { Metadata } from 'next';
import { IBM_Plex_Mono, Space_Grotesk } from 'next/font/google';
import { Sidebar } from '@/components/Sidebar';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-ibm-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'ProjectHub Dashboard',
  description: 'Day 6 beginner frontend for ProjectHub',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} antialiased`}>
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fef3c7,transparent_55%),radial-gradient(circle_at_bottom_right,#dbeafe,transparent_60%),#f8fafc]">
          <div className="mx-auto flex min-h-screen max-w-7xl flex-col md:flex-row">
            <Sidebar />
            <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
