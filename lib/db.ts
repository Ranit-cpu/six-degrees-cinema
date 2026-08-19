import neo4j, { Driver } from 'neo4j-driver';

let driver: Driver | null = null;

export function getDriver(): Driver {
  if (driver) return driver;

  const uri = process.env.COGNODB_URI;
  const password = process.env.COGNODB_PASSWORD;

  if (!uri || !password) {
    throw new Error(
      'Missing COGNODB_URI or COGNODB_PASSWORD environment variables. ' +
        'Copy .env.example to .env.local and fill in your CognoDB Cloud connection details.'
    );
  }

  driver = neo4j.driver(uri, neo4j.auth.basic('cognodb', password), {
    maxConnectionPoolSize: 20,
  });

  return driver;
}

export async function closeDriver() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

/** Thrown whenever a query fails so pages/routes can render a friendly fallback. */
export class DatabaseUnavailableError extends Error {
  constructor(cause: unknown) {
    super('Could not reach the database. It may be paused, unreachable, or misconfigured.');
    this.name = 'DatabaseUnavailableError';
    this.cause = cause;
  }
}

export async function runQuery<T = Record<string, any>>(
  cypher: string,
  params: Record<string, any> = {}
): Promise<T[]> {
  const session = getDriver().session();
  try {
    const result = await session.run(cypher, params);
    return result.records.map(r => r.toObject() as T);
  } catch (err) {
    throw new DatabaseUnavailableError(err);
  } finally {
    await session.close();
  }
}
