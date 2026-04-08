import type { Metadata } from 'next';
import { IBM_Plex_Mono, Space_Grotesk } from 'next/font/google';
import { AppShell } from '@/components/AppShell';
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
  description: 'frontend for ProjectHub',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} antialiased`}>
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#0f172a,transparent_45%),radial-gradient(circle_at_bottom_right,#1e293b,transparent_50%),#020617]">
          <div className="mx-auto min-h-screen w-full">
            <AppShell>{children}</AppShell>
          </div>
        </div>
      </body>
    </html>
  );
}
