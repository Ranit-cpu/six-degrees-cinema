import neo4j from 'neo4j-driver';
import { runQuery } from './db';

function toNumber(v: any): number | null {
  if (v === null || v === undefined) return null;
  return neo4j.isInt(v) ? v.toNumber() : v;
}

export type PersonSummary = { id: string; name: string };
export type MovieSummary = { id: string; title: string; year: number | null };

/** Powers the search box: actors and films matching a substring, by name/title. */
export async function searchAll(term: string, limit = 8) {
  const [people, movies] = await Promise.all([
    runQuery<{ id: string; name: string }>(
      `MATCH (p:Person) WHERE toLower(p.name) CONTAINS toLower($term)
       RETURN p.id AS id, p.name AS name
       ORDER BY p.name LIMIT $limit`,
      { term, limit: neo4j.int(limit) }
    ),
    runQuery<{ id: string; title: string; year: any }>(
      `MATCH (m:Movie) WHERE toLower(m.title) CONTAINS toLower($term)
       RETURN m.id AS id, m.title AS title, m.year AS year
       ORDER BY m.popularity DESC LIMIT $limit`,
      { term, limit: neo4j.int(limit) }
    ),
  ]);
  return {
    people,
    movies: movies.map(m => ({ ...m, year: toNumber(m.year) })),
  };
}

/** Actor profile: filmography plus the actors they've most frequently shared a set with. */
export async function getActor(id: string) {
  const rows = await runQuery<{ name: string; films: any[] }>(
    `MATCH (p:Person {id: $id})
     OPTIONAL MATCH (p)-[r:ACTED_IN]->(m:Movie)
     RETURN p.name AS name,
            collect(DISTINCT {id: m.id, title: m.title, year: m.year, character: r.character}) AS films`,
    { id }
  );
  if (rows.length === 0 || !rows[0].name) return null;

  const coStars = await runQuery<{ id: string; name: string; sharedMovies: any }>(
    `MATCH (p:Person {id: $id})-[:ACTED_IN]->(:Movie)<-[:ACTED_IN]-(co:Person)
     WHERE co.id <> $id
     RETURN co.id AS id, co.name AS name, count(*) AS sharedMovies
     ORDER BY sharedMovies DESC LIMIT 12`,
    { id }
  );

  return {
    id,
    name: rows[0].name,
    films: rows[0].films
      .filter(f => f.id)
      .map(f => ({ ...f, year: toNumber(f.year) }))
      .sort((a, b) => (b.year ?? 0) - (a.year ?? 0)),
    coStars: coStars.map(c => ({ ...c, sharedMovies: toNumber(c.sharedMovies) })),
  };
}

/** Movie detail: cast, director, genres, and 2-hop "shared cast" recommendations. */
export async function getMovie(id: string) {
  const rows = await runQuery<{
    title: string;
    year: any;
    rating: number;
    genres: string[];
    directors: any[];
    cast: any[];
  }>(
    `MATCH (m:Movie {id: $id})
     OPTIONAL MATCH (m)-[:IN_GENRE]->(g:Genre)
     OPTIONAL MATCH (p:Person)-[r:ACTED_IN]->(m)
     OPTIONAL MATCH (d:Person)-[:DIRECTED]->(m)
     RETURN m.title AS title, m.year AS year, m.rating AS rating,
            collect(DISTINCT g.name) AS genres,
            collect(DISTINCT {id: d.id, name: d.name}) AS directors,
            collect(DISTINCT {id: p.id, name: p.name, character: r.character}) AS cast`,
    { id }
  );
  if (rows.length === 0 || !rows[0].title) return null;
  const row = rows[0];

  // The "awkward in SQL" query: films that share cast members with this one,
  // ranked by how many people overlap — a variable self-join a relational
  // schema would need a recursive/self-referencing subquery to express cleanly.
  const recommendations = await runQuery<{ id: string; title: string; year: any; overlap: any }>(
    `MATCH (m:Movie {id: $id})<-[:ACTED_IN]-(p:Person)-[:ACTED_IN]->(rec:Movie)
     WHERE rec.id <> $id
     WITH rec, count(DISTINCT p) AS overlap
     RETURN rec.id AS id, rec.title AS title, rec.year AS year, overlap
     ORDER BY overlap DESC, rec.popularity DESC LIMIT 8`,
    { id }
  );

  return {
    id,
    title: row.title,
    year: toNumber(row.year),
    rating: row.rating,
    genres: row.genres.filter(Boolean),
    directors: row.directors.filter((d: any) => d.id),
    cast: row.cast.filter((c: any) => c.id).slice(0, 20),
    recommendations: recommendations.map(r => ({
      ...r,
      year: toNumber(r.year),
      overlap: toNumber(r.overlap),
    })),
  };
}

export type PathResult = {
  people: { id: string; name: string }[];
  movies: { id: string; title: string; year: number | null }[];
  hops: number;
} | null;

/**
 * The flagship multi-hop query: shortest chain of shared films connecting
 * two actors. Capped at 6 hops so a runaway search can't hang the free tier.
 */
export async function findPath(aId: string, bId: string): Promise<PathResult> {
  const rows = await runQuery<{ nodes: any[]; hops: any }>(
    `MATCH path = shortestPath((a:Person {id: $aId})-[:ACTED_IN*..6]-(b:Person {id: $bId}))
     RETURN nodes(path) AS nodes, length(path) AS hops`,
    { aId, bId }
  );
  if (rows.length === 0) return null;

  const nodes = rows[0].nodes;
  const people = nodes
    .filter((n: any) => n.labels?.includes('Person'))
    .map((n: any) => ({ id: n.properties.id, name: n.properties.name }));
  const movies = nodes
    .filter((n: any) => n.labels?.includes('Movie'))
    .map((n: any) => ({
      id: n.properties.id,
      title: n.properties.title,
      year: toNumber(n.properties.year),
    }));

  return { people, movies, hops: toNumber(rows[0].hops) ?? 0 };
}
