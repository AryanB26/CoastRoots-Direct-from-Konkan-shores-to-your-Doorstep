import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useStore } from '../store.jsx';
import ProductCard from '../components/ProductCard.jsx';

export default function Home() {
  const { t } = useStore();
  const [meta, setMeta] = useState({ categories: [], districts: [] });
  const [f, setF] = useState({
    q: '',
    category: '',
    district: '',
    min: '',
    max: '',
    sort: 'newest',
    inSeason: false,
    page: 1,
  });
  const [data, setData] = useState({ items: [], pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const set = (k, v) => setF((o) => ({ ...o, [k]: v, page: k === 'page' ? v : 1 }));

  const hasActiveFilters = Boolean(
    f.q || f.category || f.district || f.min || f.max || f.inSeason || f.sort !== 'newest'
  );

  const resetFilters = () => {
    setF({
      q: '',
      category: '',
      district: '',
      min: '',
      max: '',
      sort: 'newest',
      inSeason: false,
      page: 1,
    });
  };

  useEffect(() => {
    api('/products/meta').then(setMeta).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams(
      Object.entries(f).filter(([, v]) => v !== '' && v !== false)
    ).toString();
    const id = setTimeout(() => {
      api(`/products?${qs}`)
        .then(setData)
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(id);
  }, [f]);

  return (
    <>
      <section className="hero">
        <div>
          <div
            className="seasonal-banner"
            role="button"
            style={{ cursor: 'pointer' }}
            onClick={() => set('category', 'Fruits')}
          >
            <span className="tag on" style={{ fontSize: '0.75rem', padding: '0.2em 0.6em' }}>Seasonal</span>
            <span>
              <strong>Konkan Alphonso Harvest:</strong> Fresh Devgad & Ratnagiri batches available now
            </span>
          </div>

          <h1>{t('tagline')}</h1>
          <p>
            Alphonso mangoes from Devgad, kokum from Guhagar, stone-pounded masalas from Malvan.
            Authentic coastal delicacies shipped straight from verified family orchards and coastal artisans.
          </p>

          <div className="search-box">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: 0.5, flexShrink: 0 }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              placeholder={t('search')}
              value={f.q}
              onChange={(e) => set('q', e.target.value)}
              aria-label="Search products"
            />
            {f.q && (
              <button
                type="button"
                className="ghost"
                onClick={() => set('q', '')}
                style={{ padding: '0.2em 0.6em', border: 'none', color: 'var(--muted)', fontSize: '0.9rem' }}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Category Quick Chips Bar */}
      <div className="chips-bar" role="region" aria-label="Category filters">
        <button
          type="button"
          className={`chip ${f.category === '' ? 'active' : ''}`}
          onClick={() => set('category', '')}
        >
          {t('all')}
        </button>
        {meta.categories.map((c) => (
          <button
            key={c}
            type="button"
            className={`chip ${f.category === c ? 'active' : ''}`}
            onClick={() => set('category', f.category === c ? '' : c)}
          >
            <span>{c}</span>
          </button>
        ))}
      </div>

      <div className="layout">
        <aside className="filters-card">
          <div className="filters-header">
            <h3>Filters</h3>
            {hasActiveFilters && (
              <button type="button" className="clear-link" onClick={resetFilters}>
                {t('clearFilters')}
              </button>
            )}
          </div>

          <label>
            {t('category')}
            <select value={f.category} onChange={(e) => set('category', e.target.value)}>
              <option value="">{t('all')}</option>
              {meta.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label>
            {t('district')}
            <select value={f.district} onChange={(e) => set('district', e.target.value)}>
              <option value="">{t('all')}</option>
              {meta.districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>

          <div className="two">
            <label>
              Min (₹)
              <input
                type="number"
                min="0"
                placeholder="0"
                value={f.min}
                onChange={(e) => set('min', e.target.value)}
              />
            </label>
            <label>
              Max (₹)
              <input
                type="number"
                min="0"
                placeholder="2000"
                value={f.max}
                onChange={(e) => set('max', e.target.value)}
              />
            </label>
          </div>

          <label>
            {t('sortBy')}
            <select value={f.sort} onChange={(e) => set('sort', e.target.value)}>
              <option value="newest">Newest additions</option>
              <option value="priceAsc">Price: Low to High</option>
              <option value="priceDesc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </label>

          <label className="check" style={{ borderTop: '1px solid var(--line)', paddingTop: '0.8rem' }}>
            <input
              type="checkbox"
              checked={f.inSeason}
              onChange={(e) => set('inSeason', e.target.checked)}
            />
            <span>Only in-season now</span>
          </label>
        </aside>

        <section>
          <div className="row" style={{ marginBottom: '1.2rem' }}>
            <p className="muted" style={{ fontWeight: 500 }}>
              {loading ? 'Searching coastal produce…' : `Showing ${data.total} Konkan products`}
            </p>
            {f.category && (
              <span className="tag neutral">
                Category: {f.category}
              </span>
            )}
          </div>

          {!loading && data.items.length === 0 && (
            <div className="empty" style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--line)' }}>
              <h3>No matching products found</h3>
              <p className="muted">Try relaxing your price filters or searching for terms like "mango", "kokum", or "masala".</p>
              {hasActiveFilters && (
                <button style={{ marginTop: '1rem' }} onClick={resetFilters}>
                  Reset All Filters
                </button>
              )}
            </div>
          )}

          <div className="grid">
            {data.items.map((p) => (
              <ProductCard key={p._id} p={p} />
            ))}
          </div>

          {data.pages > 1 && (
            <div className="pager">
              <button
                className="ghost"
                disabled={f.page <= 1}
                onClick={() => set('page', f.page - 1)}
              >
                Previous
              </button>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                Page {f.page} of {data.pages}
              </span>
              <button
                className="ghost"
                disabled={f.page >= data.pages}
                onClick={() => set('page', f.page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
