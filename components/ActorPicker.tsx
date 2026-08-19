'use client';

import { useEffect, useState } from 'react';

type Person = { id: string; name: string };

export default function ActorPicker({
  label,
  onSelect,
  initial,
}: {
  label: string;
  onSelect: (person: Person) => void;
  initial?: Person;
}) {
  const [term, setTerm] = useState('');
  const [options, setOptions] = useState<Person[]>([]);
  const [selected, setSelected] = useState<Person | null>(initial ?? null);

  useEffect(() => {
    if (term.trim().length < 2 || selected) {
      setOptions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
      if (!res.ok) return;
      const data = await res.json();
      setOptions(data.people ?? []);
    }, 300);
    return () => clearTimeout(timer);
  }, [term, selected]);

  return (
    <div>
      <label className="font-mono text-xs uppercase tracking-widest text-muted block mb-2">{label}</label>
      {selected ? (
        <div className="flex items-center justify-between bg-surface border border-marquee rounded-md px-4 py-3">
          <span>{selected.name}</span>
          <button
            onClick={() => {
              setSelected(null);
              setTerm('');
            }}
            className="text-muted hover:text-velvet text-xs font-mono uppercase"
          >
            Change
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            value={term}
            onChange={e => setTerm(e.target.value)}
            placeholder="Type an actor's name..."
            className="w-full bg-surface border border-white/10 rounded-md px-4 py-3 text-paper placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-marquee"
          />
          {options.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full bg-surface border border-white/10 rounded-md overflow-hidden shadow-lg">
              {options.map(p => (
                <li key={p.id}>
                  <button
                    onClick={() => {
                      setSelected(p);
                      onSelect(p);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-ink transition"
                  >
                    {p.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
