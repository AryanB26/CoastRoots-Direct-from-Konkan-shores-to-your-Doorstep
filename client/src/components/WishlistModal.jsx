import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, inr } from '../api.js';
import { useStore } from '../store.jsx';

export default function WishlistModal() {
  const { wishlistOpen, setWishlistOpen, user, toggleWish, addToCart, t } = useStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!wishlistOpen || !user) return;
    setLoading(true);
    api('/auth/wishlist')
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [wishlistOpen, user]);

  if (!wishlistOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => setWishlistOpen(false)} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ borderBottom: '1px solid var(--line)', paddingBottom: '0.8rem', marginBottom: '1.2rem' }}>
          <h2>{t('wishlist')} ({user?.wishlist?.length || 0})</h2>
          <button className="ghost" onClick={() => setWishlistOpen(false)} aria-label="Close wishlist">✕</button>
        </div>

        {loading && <p className="pad">Loading saved products…</p>}

        {!loading && items.length === 0 && (
          <div className="empty">
            <h3>Your wishlist is empty</h3>
            <p className="muted">Save any Konkan specialty to revisit it later.</p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="stack">
            {items.map((p) => (
              <div key={p._id} className="line">
                <div className="cart-thumb">
                  {p.image ? (
                    <img src={p.image} alt={p.name} />
                  ) : (
                    <span className="muted" style={{ fontSize: '0.8rem' }}>Item</span>
                  )}
                </div>
                <div>
                  <Link to={`/product/${p._id}`} onClick={() => setWishlistOpen(false)} style={{ fontWeight: 600 }}>
                    {p.name}
                  </Link>
                  <p className="muted">{inr(p.price)} / {p.unit} · {p.village}, {p.district}</p>
                </div>
                <strong>{inr(p.price)}</strong>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    disabled={p.stock < 1}
                    onClick={() => {
                      addToCart(p);
                      toggleWish(p._id);
                      setItems((prev) => prev.filter((item) => item._id !== p._id));
                    }}
                  >
                    {p.stock < 1 ? 'Sold out' : t('add')}
                  </button>
                  <button
                    className="ghost"
                    onClick={async () => {
                      await toggleWish(p._id);
                      setItems((prev) => prev.filter((item) => item._id !== p._id));
                    }}
                    title="Remove from wishlist"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
