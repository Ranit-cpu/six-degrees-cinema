'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Result = {
  people: { id: string; name: string }[];
  movies: { id: string; title: string; year: number | null }[];
};

export default function SearchBox() {
  const [term, setTerm] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  useEffect(() => {
    if (term.trim().length < 2) {
      setResult(null);
      setStatus('idle');
      return;
    }
    setStatus('loading');
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
        if (!res.ok) throw new Error('search failed');
        const data = await res.json();
        setResult(data);
        setStatus('idle');
      } catch {
        setStatus('error');
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [term]);

  return (
    <div className="w-full">
      <input
        value={term}
        onChange={e => setTerm(e.target.value)}
        placeholder="Search for an actor or a film..."
        className="w-full bg-surface border border-white/10 rounded-md px-4 py-3 text-paper placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-marquee"
        aria-label="Search actors and films"
      />

      {status === 'loading' && (
        <p className="mt-3 font-mono text-xs text-muted uppercase tracking-widest">Searching...</p>
      )}
      {status === 'error' && (
        <p className="mt-3 font-mono text-xs text-velvet uppercase tracking-widest">
          Couldn&apos;t reach the database. Try again in a moment.
        </p>
      )}

      {result && status !== 'loading' && result.people.length === 0 && result.movies.length === 0 && (
        <p className="mt-3 text-muted text-sm">No matches for &ldquo;{term}&rdquo;. Try a different spelling.</p>
      )}

      {result && (result.people.length > 0 || result.movies.length > 0) && (
        <div className="mt-4 grid sm:grid-cols-2 gap-6">
          {result.people.length > 0 && (
            <div>
              <h3 className="font-mono text-xs uppercase tracking-widest text-muted mb-2">Actors</h3>
              <ul className="space-y-1">
                {result.people.map(p => (
                  <li key={p.id}>
                    <Link href={`/actor/${p.id}`} className="hover:text-marquee transition-colors">
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.movies.length > 0 && (
            <div>
              <h3 className="font-mono text-xs uppercase tracking-widest text-muted mb-2">Films</h3>
              <ul className="space-y-1">
                {result.movies.map(m => (
                  <li key={m.id}>
                    <Link href={`/movie/${m.id}`} className="hover:text-marquee transition-colors">
                      {m.title} {m.year ? <span className="text-muted">({m.year})</span> : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
