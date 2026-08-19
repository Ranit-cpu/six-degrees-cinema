import Link from 'next/link';
import { getMovie } from '@/lib/queries';
import { DatabaseUnavailableError } from '@/lib/db';
import { ErrorState, EmptyState } from '@/components/States';
import FilmStrip from '@/components/FilmStrip';

export default async function MoviePage({ params }: { params: { id: string } }) {
  let movie;
  try {
    movie = await getMovie(params.id);
  } catch (err) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16">
        <ErrorState message={err instanceof DatabaseUnavailableError ? err.message : undefined} />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16">
        <EmptyState message="No film found with this id." />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-marquee mb-2">
        {movie.genres.join(' · ') || 'Film'}
      </p>
      <h1 className="font-display text-4xl mb-2">{movie.title}</h1>
      <p className="text-muted mb-8">
        {movie.year ?? 'Year unknown'}
        {movie.rating ? ` · ${movie.rating.toFixed(1)}★` : ''}
        {movie.directors.length > 0 && <> · Directed by {movie.directors.map((d: any) => d.name).join(', ')}</>}
      </p>

      <section>
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted mb-3">Cast</h2>
        {movie.cast.length === 0 ? (
          <EmptyState message="No cast on record." />
        ) : (
          <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
            {movie.cast.map((c: any) => (
              <li key={c.id} className="flex justify-between gap-3">
                <Link href={`/actor/${c.id}`} className="hover:text-marquee transition-colors">
                  {c.name}
                </Link>
                <span className="text-muted text-sm truncate">{c.character}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <FilmStrip />

      <section>
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted mb-3">If you liked this, try</h2>
        {movie.recommendations.length === 0 ? (
          <EmptyState message="Not enough shared cast yet to recommend anything." />
        ) : (
          <ul className="space-y-2">
            {movie.recommendations.map(r => (
              <li key={r.id} className="flex justify-between items-baseline gap-4">
                <Link href={`/movie/${r.id}`} className="hover:text-marquee transition-colors">
                  {r.title}
                </Link>
                <span className="font-mono text-xs text-muted whitespace-nowrap">
                  {r.overlap} shared cast member{r.overlap === 1 ? '' : 's'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
