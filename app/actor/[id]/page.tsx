import Link from 'next/link';
import { getActor } from '@/lib/queries';
import { DatabaseUnavailableError } from '@/lib/db';
import { ErrorState, EmptyState } from '@/components/States';
import FilmStrip from '@/components/FilmStrip';

export default async function ActorPage({ params }: { params: { id: string } }) {
  let actor;
  try {
    actor = await getActor(params.id);
  } catch (err) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16">
        <ErrorState message={err instanceof DatabaseUnavailableError ? err.message : undefined} />
      </div>
    );
  }

  if (!actor) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16">
        <EmptyState message="No actor found with this id." />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-marquee mb-2">Actor</p>
      <h1 className="font-display text-4xl mb-8">{actor.name}</h1>

      <section>
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted mb-3">
          Filmography ({actor.films.length})
        </h2>
        {actor.films.length === 0 ? (
          <EmptyState message="No films on record for this actor." />
        ) : (
          <ul className="divide-y divide-white/10">
            {actor.films.map(f => (
              <li key={f.id} className="py-3 flex justify-between items-baseline gap-4">
                <Link href={`/movie/${f.id}`} className="hover:text-marquee transition-colors">
                  {f.title}
                </Link>
                <span className="font-mono text-xs text-muted whitespace-nowrap">{f.year ?? '—'}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <FilmStrip />

      <section>
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted mb-3">Frequent co-stars</h2>
        {actor.coStars.length === 0 ? (
          <EmptyState message="No shared credits found yet." />
        ) : (
          <div className="flex flex-wrap gap-2">
            {actor.coStars.map(c => (
              <Link
                key={c.id}
                href={`/actor/${c.id}`}
                className="bg-surface border border-white/10 rounded-full px-3 py-1 text-sm hover:border-marquee transition"
              >
                {c.name} <span className="text-muted font-mono text-xs">×{c.sharedMovies}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="mt-10">
        <Link
          href={`/path?a=${actor.id}`}
          className="font-mono text-xs uppercase tracking-widest bg-marquee text-ink px-4 py-2 rounded-md hover:brightness-110 transition"
        >
          Find their path to someone else →
        </Link>
      </div>
    </div>
  );
}
