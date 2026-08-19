import { LoadingSkeleton } from '@/components/States';

export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <LoadingSkeleton />
    </div>
  );
}
