import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Search } from 'lucide-react';
import { SearchResult, searchService } from '../../services/search.service';
import { ThemeToggle } from '../../shared/components/ThemeToggle';

const typeLabel: Record<SearchResult['type'], string> = {
  materia: 'Materia',
  material: 'Material',
  semana: 'Semana',
  video: 'Video',
  ejercicio: 'Ejercicio',
};

export const BuscarPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentQuery = searchParams.get('q') || '';
    setQuery(currentQuery);

    if (currentQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    const loadResults = async () => {
      try {
        setLoading(true);
        setError(null);
        setResults(await searchService.search(currentQuery));
      } catch (err) {
        console.error('Error buscando:', err);
        setError('No se pudo realizar la busqueda');
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [searchParams]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSearchParams(query.trim() ? { q: query.trim() } : {});
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="border-b border-slate-200 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/85">
        <div className="mx-auto flex max-w-screen-2xl items-start justify-between gap-3 px-4 py-4 sm:items-center sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/materias"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
              aria-label="Volver a materias"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl font-black sm:text-2xl">
                Busqueda global
              </h1>
              <p className="text-sm leading-5 text-slate-600 dark:text-slate-300">
                Materias, semanas, materiales, videos y ejercicios.
              </p>
            </div>
          </div>
          <ThemeToggle className="shrink-0" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Buscar por titulo, codigo o descripcion..."
              className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10 dark:border-white/10 dark:bg-slate-900 dark:text-white"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 font-black text-slate-950 shadow-lg shadow-emerald-950/15 hover:bg-emerald-300"
            >
              <Search className="h-4 w-4" />
              Buscar
            </button>
          </div>
        </form>

        {loading && (
          <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-10 text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Buscando...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-100">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          searchParams.get('q') &&
          results.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 dark:border-white/15 dark:bg-slate-900 dark:text-slate-400">
              No se encontraron resultados.
            </div>
          )}

        {!loading && results.length > 0 && (
          <div className="space-y-3">
            {results.map(result => (
              <Link key={result.id} to={result.href}>
                <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-950/5 transition-all hover:-translate-y-0.5 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:hover:bg-white/5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="font-black">{result.title}</h2>
                      {result.detail && (
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          {result.detail}
                        </p>
                      )}
                    </div>
                    <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800 dark:bg-emerald-300/15 dark:text-emerald-100">
                      {typeLabel[result.type]}
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default BuscarPage;
