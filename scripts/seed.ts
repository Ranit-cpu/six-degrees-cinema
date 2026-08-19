/**
 * Seeds CognoDB with a subset of the "TMDB 5000 Movie Dataset" (Kaggle).
 *
 * Before running:
 *   1. Download tmdb_5000_movies.csv and tmdb_5000_credits.csv from
 *      https://www.kaggle.com/datasets/tmdb/tmdb-movie-metadata
 *   2. Place both files in ./data/
 *   3. Fill in .env.local with your CognoDB URI + password
 *
 * Run with: npm run seed
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { getDriver, closeDriver } from '../lib/db';

const DATA_DIR = path.join(process.cwd(), 'data');
const MOVIES_CSV = path.join(DATA_DIR, 'tmdb_5000_movies.csv');
const CREDITS_CSV = path.join(DATA_DIR, 'tmdb_5000_credits.csv');

// Keep the free c0 instance (256MB RAM) comfortable. Raise this if you upgrade tiers.
const MAX_MOVIES = Number(process.env.SEED_MOVIE_LIMIT ?? 800);
const CAST_PER_MOVIE = 12;
const BATCH_SIZE = 500;

type MovieRow = { id: string; title: string; year: number | null; rating: number; popularity: number };
type PersonRow = { id: string; name: string };
type ActedInRow = { personId: string; movieId: string; character: string };
type DirectedRow = { personId: string; movieId: string };
type InGenreRow = { movieId: string; genre: string };

function readCsv(filePath: string): Record<string, string>[] {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return parse(raw, { columns: true, skip_empty_lines: true, relax_quotes: true });
}

function safeJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function runBatched<T>(
  session: ReturnType<ReturnType<typeof getDriver>['session']>,
  label: string,
  items: T[],
  cypher: string
) {
  console.log(`Loading ${label} (${items.length} rows)...`);
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const chunk = items.slice(i, i + BATCH_SIZE);
    await session.run(cypher, { rows: chunk });
    console.log(`  ...${Math.min(i + BATCH_SIZE, items.length)}/${items.length}`);
  }
}

async function main() {
  if (!fs.existsSync(MOVIES_CSV) || !fs.existsSync(CREDITS_CSV)) {
    console.error(
      'Missing data files.\n' +
        'Download tmdb_5000_movies.csv and tmdb_5000_credits.csv from the Kaggle\n' +
        '"TMDB 5000 Movie Dataset" and place them in ./data/ — see data/README.md.'
    );
    process.exit(1);
  }

  console.log('Reading CSVs...');
  const moviesRaw = readCsv(MOVIES_CSV);
  const creditsRaw = readCsv(CREDITS_CSV);
  const creditsByMovieId = new Map(creditsRaw.map(c => [c.movie_id, c]));

  const movies: MovieRow[] = [];
  const genres = new Set<string>();
  const inGenre: InGenreRow[] = [];
  const people = new Map<string, PersonRow>();
  const actedIn: ActedInRow[] = [];
  const directed: DirectedRow[] = [];

  const selected = moviesRaw
    .filter(m => creditsByMovieId.has(m.id))
    .sort((a, b) => Number(b.popularity) - Number(a.popularity))
    .slice(0, MAX_MOVIES);

  for (const m of selected) {
    const year = m.release_date ? Number(m.release_date.slice(0, 4)) : null;
    movies.push({
      id: m.id,
      title: m.title || m.original_title,
      year: Number.isFinite(year) ? year : null,
      rating: Number(m.vote_average) || 0,
      popularity: Number(m.popularity) || 0,
    });

    const movieGenres = safeJson<{ id: number; name: string }[]>(m.genres, []);
    for (const g of movieGenres) {
      genres.add(g.name);
      inGenre.push({ movieId: m.id, genre: g.name });
    }

    const credit = creditsByMovieId.get(m.id)!;
    const cast = safeJson<{ id: number; name: string; character: string; order: number }[]>(credit.cast, []);
    for (const c of cast.slice(0, CAST_PER_MOVIE)) {
      const personId = String(c.id);
      people.set(personId, { id: personId, name: c.name });
      actedIn.push({ personId, movieId: m.id, character: c.character || '' });
    }

    const crew = safeJson<{ id: number; name: string; job: string }[]>(credit.crew, []);
    for (const c of crew.filter(member => member.job === 'Director')) {
      const personId = String(c.id);
      people.set(personId, { id: personId, name: c.name });
      directed.push({ personId, movieId: m.id });
    }
  }

  console.log(
    `Prepared ${movies.length} movies, ${people.size} people, ${genres.size} genres, ` +
      `${actedIn.length} ACTED_IN edges, ${directed.length} DIRECTED edges.`
  );

  const driver = getDriver();
  const session = driver.session();
  try {
    console.log('Creating constraints...');
    await session.run('CREATE CONSTRAINT person_id IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE');
    await session.run('CREATE CONSTRAINT movie_id IF NOT EXISTS FOR (m:Movie) REQUIRE m.id IS UNIQUE');
    await session.run('CREATE CONSTRAINT genre_name IF NOT EXISTS FOR (g:Genre) REQUIRE g.name IS UNIQUE');

    await runBatched(
      session,
      'movies',
      movies,
      `UNWIND $rows AS row
       MERGE (m:Movie {id: row.id})
       SET m.title = row.title, m.year = row.year, m.rating = row.rating, m.popularity = row.popularity`
    );

    await runBatched(
      session,
      'people',
      Array.from(people.values()),
      `UNWIND $rows AS row
       MERGE (p:Person {id: row.id})
       SET p.name = row.name`
    );

    console.log(`Loading genres (${genres.size} rows)...`);
    await session.run(`UNWIND $rows AS name MERGE (g:Genre {name: name})`, { rows: Array.from(genres) });

    await runBatched(
      session,
      'ACTED_IN',
      actedIn,
      `UNWIND $rows AS row
       MATCH (p:Person {id: row.personId}), (m:Movie {id: row.movieId})
       MERGE (p)-[r:ACTED_IN]->(m)
       SET r.character = row.character`
    );

    await runBatched(
      session,
      'DIRECTED',
      directed,
      `UNWIND $rows AS row
       MATCH (p:Person {id: row.personId}), (m:Movie {id: row.movieId})
       MERGE (p)-[:DIRECTED]->(m)`
    );

    await runBatched(
      session,
      'IN_GENRE',
      inGenre,
      `UNWIND $rows AS row
       MATCH (m:Movie {id: row.movieId}), (g:Genre {name: row.genre})
       MERGE (m)-[:IN_GENRE]->(g)`
    );

    const counts = await session.run('MATCH (n) RETURN labels(n)[0] AS label, count(*) AS count');
    console.log('\nDone. Node counts:');
    counts.records.forEach(r => console.log(`  ${r.get('label')}: ${r.get('count')}`));
  } finally {
    await session.close();
    await closeDriver();
  }
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
