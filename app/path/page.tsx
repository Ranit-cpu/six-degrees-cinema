import { getActor } from '@/lib/queries';
import PathFinder from '@/components/PathFinder';

export default async function PathPage({ searchParams }: { searchParams: { a?: string } }) {
  let initialA;
  if (searchParams.a) {
    try {
      const actor = await getActor(searchParams.a);
      if (actor) initialA = { id: actor.id, name: actor.name };
    } catch {
      // If the prefill lookup fails, the picker still works manually — no need to block the page.
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-marquee mb-3">Multi-hop traversal</p>
      <h1 className="font-display text-4xl mb-4">FIND THE PATH</h1>
      <p className="text-muted mb-10 max-w-xl">
        Pick two actors and we&apos;ll find the shortest chain of shared films connecting them — the
        kind of query a relational database handles with painful recursive joins.
      </p>
      <PathFinder initialA={initialA} />
    </div>
  );
}
