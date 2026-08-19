export function EmptyState({ message }: { message: string }) {
  return <p className="text-muted text-sm py-8 text-center">{message}</p>;
}

export function ErrorState({ message }: { message?: string }) {
  return (
    <div className="border border-velvet/40 bg-velvet/10 rounded-md px-4 py-3 text-sm text-paper">
      <p className="font-mono text-xs uppercase tracking-widest text-velvet mb-1">Database unreachable</p>
      <p>{message ?? 'Something went wrong reaching CognoDB. Check your connection details and try again.'}</p>
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-3" aria-busy="true" aria-live="polite">
      <div className="h-4 bg-surface rounded w-1/3" />
      <div className="h-4 bg-surface rounded w-1/2" />
      <div className="h-4 bg-surface rounded w-1/4" />
    </div>
  );
}
