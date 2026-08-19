import { NextRequest, NextResponse } from 'next/server';
import { searchAll } from '@/lib/queries';
import { DatabaseUnavailableError } from '@/lib/db';

export async function GET(req: NextRequest) {
  const term = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (term.length < 2) {
    return NextResponse.json({ people: [], movies: [] });
  }

  try {
    const results = await searchAll(term);
    return NextResponse.json(results);
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
