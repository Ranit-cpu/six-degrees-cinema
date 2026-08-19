import type { Metadata } from 'next';
import { Anton, Inter, IBM_Plex_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const anton = Anton({ subsets: ['latin'], weight: '400', variable: '--font-display' });
const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Six Degrees of Cinema',
  description: 'Explore how actors and films connect, powered by a graph database.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${anton.variable} ${inter.variable} ${plexMono.variable}`}>
      <body className="bg-ink text-paper font-body min-h-screen flex flex-col">
        <header className="border-b border-white/10 sticky top-0 z-20 bg-ink/90 backdrop-blur">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="font-display text-2xl tracking-wide text-marquee">
              SIX DEGREES <span className="text-paper">OF CINEMA</span>
            </Link>
            <nav className="font-mono text-xs uppercase tracking-widest text-muted flex gap-6">
              <Link href="/" className="hover:text-marquee transition-colors">Search</Link>
              <Link href="/path" className="hover:text-marquee transition-colors">Find the Path</Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-white/10 py-6">
          <div className="max-w-5xl mx-auto px-6 font-mono text-[11px] text-muted uppercase tracking-widest">
            Built on a graph database — every connection is a real relationship, not a join
          </div>
        </footer>
      </body>
    </html>
  );
}
