import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import BottomNav from '../../components/common/BottomNav';
import PropertyCard from '../../components/property/PropertyCard';
import Skeleton from '../../components/ui/Skeleton';
import { useLocation } from '../../context/LocationContext';
import api from '../../services/api';

export default function SearchResults() {
  const [params] = useSearchParams();
  const { coords } = useLocation();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    const q = new URLSearchParams(params);
    if (!q.get('lat') && coords?.lat) { q.set('lat', coords.lat); q.set('lng', coords.lng); }
    api.get(`/properties/search?${q.toString()}`)
      .then(({ data }) => setResults(data.results || []))
      .catch((err) => setError(err.response?.data?.message || 'Search failed'))
      .finally(() => setLoading(false));
  }, [params, coords]);

  const activeFilters = [...params.entries()].filter(([k]) => !['lat', 'lng', 'radiusKm', 'limit'].includes(k));

  return (
    <div className="min-h-screen bg-surface pb-20 md:pb-0">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-5">
        <h1 className="text-xl font-extrabold text-navy">Search Results</h1>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {activeFilters.length
            ? activeFilters.map(([k, v]) => <span key={k} className="rounded-full bg-forest/15 border border-forest/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-forest">{k}: {v}</span>)
            : <span className="text-xs text-navy/60">No filters — showing top-rated available listings.</span>}
        </div>
        {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
        <div className="mt-4">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-64" />)}</div>
          ) : results.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">Nothing matched. Try removing a filter or widening the radius.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{results.map((p) => <PropertyCard key={p.id} property={p} />)}</div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
