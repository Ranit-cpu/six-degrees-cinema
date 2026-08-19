'use client';

import { useState } from 'react';
import Link from 'next/link';
import ActorPicker from './ActorPicker';
import { EmptyState, ErrorState, LoadingSkeleton } from './States';

type Person = { id: string; name: string };
type PathResult = {
  people: { id: string; name: string }[];
  movies: { id: string; title: string; year: number | null }[];
  hops: number;
} | null;

export default function PathFinder({ initialA }: { initialA?: Person }) {
  const [a, setA] = useState<Person | null>(initialA ?? null);
  const [b, setB] = useState<Person | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'done'>('idle');
  const [result, setResult] = useState<PathResult>(null);
  const [errorMsg, setErrorMsg] = useState<string>();

  async function findPath() {
    if (!a || !b) return;
    setStatus('loading');
    try {
      const res = await fetch(`/api/path?a=${a.id}&b=${b.id}`);
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error);
        setStatus('error');
        return;
      }
      setResult(data.path);
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-6 mb-6">
        <ActorPicker label="From" onSelect={setA} initial={initialA} />
        <ActorPicker label="To" onSelect={setB} />
      </div>

      <button
        onClick={findPath}
        disabled={!a || !b || status === 'loading'}
        className="font-mono text-xs uppercase tracking-widest bg-marquee text-ink px-5 py-3 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition"
      >
        {status === 'loading' ? 'Searching the graph...' : 'Find the path'}
      </button>

      <div className="mt-10">
        {status === 'error' && <ErrorState message={errorMsg} />}
        {status === 'loading' && <LoadingSkeleton />}
        {status === 'done' && result === null && (
          <EmptyState message="No connection found within 6 hops. They may simply never overlap." />
        )}
        {status === 'done' && result && <PathFrames result={result} />}
      </div>
    </div>
  );
}

function PathFrames({ result }: { result: NonNullable<PathResult> }) {
  const chain: { type: 'person' | 'movie'; id: string; label: string; sub?: string }[] = [];
  for (let i = 0; i < result.people.length; i++) {
    chain.push({ type: 'person', id: result.people[i].id, label: result.people[i].name });
    if (result.movies[i]) {
      chain.push({
        type: 'movie',
        id: result.movies[i].id,
        label: result.movies[i].title,
        sub: result.movies[i].year ? String(result.movies[i].year) : undefined,
      });
    }
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-marquee mb-4">
        Connected in {result.hops} hop{result.hops === 1 ? '' : 's'}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {chain.map((node, i) => (
          <div key={`${node.type}-${node.id}-${i}`} className="flex items-center gap-2">
            <Link
              href={node.type === 'person' ? `/actor/${node.id}` : `/movie/${node.id}`}
              className={
                node.type === 'person'
                  ? 'bg-marquee text-ink font-medium rounded-md px-3 py-2 hover:brightness-110 transition'
                  : 'bg-surface border border-white/10 rounded-md px-3 py-2 hover:border-marquee transition text-sm'
              }
            >
              {node.label}
              {node.sub && <span className="text-muted"> ({node.sub})</span>}
            </Link>
            {i < chain.length - 1 && <span className="text-muted">→</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
