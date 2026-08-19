import Link from 'next/link';
import SearchBox from '@/components/SearchBox';
import FilmStrip from '@/components/FilmStrip';

export default function HomePage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-marquee mb-3">
        A graph-backed film explorer
      </p>
      <h1 className="font-display text-5xl sm:text-6xl leading-tight mb-4">
        EVERY ACTOR IS <span className="text-marquee">A FEW HOPS</span> FROM EVERY OTHER
      </h1>
      <p className="text-muted mb-10 max-w-xl">
        Search any actor or film to see who they&apos;ve worked with, or find the shortest chain
        of shared films connecting any two performers.
      </p>

      <SearchBox />
      <FilmStrip />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-muted">Looking for the connection between two actors?</p>
        <Link
          href="/path"
          className="font-mono text-xs uppercase tracking-widest bg-marquee text-ink px-4 py-2 rounded-md hover:brightness-110 transition whitespace-nowrap"
        >
          Find the Path →
        </Link>
      </div>
    </div>
  );
}
