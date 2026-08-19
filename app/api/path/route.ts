import { NextRequest, NextResponse } from 'next/server';
import { findPath } from '@/lib/queries';
import { DatabaseUnavailableError } from '@/lib/db';

export async function GET(req: NextRequest) {
  const a = req.nextUrl.searchParams.get('a');
  const b = req.nextUrl.searchParams.get('b');

  if (!a || !b) {
    return NextResponse.json({ error: 'Both a and b actor ids are required.' }, { status: 400 });
  }

  try {
    const path = await findPath(a, b);
    return NextResponse.json({ path });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
