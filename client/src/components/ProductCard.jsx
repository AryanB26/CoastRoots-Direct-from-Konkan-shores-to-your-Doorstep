import { useState } from 'react';
import { Link } from 'react-router-dom';
import { inr, inSeason } from '../api.js';
import { useStore } from '../store.jsx';

export default function ProductCard({ p }) {
  const { addToCart, t, user, toggleWish } = useStore();
  const [imgError, setImgError] = useState(false);
  const season = inSeason(p);
  const wished = user?.wishlist?.includes(p._id);
  const sellerShop = p.seller?.seller?.shopName;

  return (
    <article className="card">
      <Link to={`/product/${p._id}`} className="tile" aria-label={p.name}>
        {p.image && !imgError ? (
          <img
            src={p.image}
            alt={p.name}
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>No image</span>
        )}

        <div style={{ position: 'absolute', top: '0.65rem', left: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', zIndex: 2 }}>
          {season !== null && (
            <span className={season ? 'tag on' : 'tag off'}>
              {season ? t('inSeason') : t('offSeason')}
            </span>
          )}
          {p.perishable && (
            <span className="tag perishable">Express</span>
          )}
        </div>
      </Link>

      <div className="body">
        {sellerShop && (
          <span className="seller-tag">
            {sellerShop}
          </span>
        )}

        <Link to={`/product/${p._id}`}>
          <h3>{p.name}</h3>
        </Link>

        <p className="muted" style={{ fontSize: '0.84rem' }}>
          {p.village ? `${p.village}, ` : ''}{p.district}
        </p>

        <div className="row" style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
          <strong>
            {inr(p.price)} <small>/ {p.unit}</small>
          </strong>
          {p.numReviews > 0 ? (
            <span className="muted" style={{ fontSize: '0.84rem' }}>
              Rating {p.ratingAvg} <small>({p.numReviews})</small>
            </span>
          ) : (
            <small className="muted">Fresh batch</small>
          )}
        </div>

        <div className="row" style={{ marginTop: '0.4rem' }}>
          <button
            style={{ flex: 1 }}
            disabled={p.stock < 1}
            onClick={() => addToCart(p)}
          >
            {p.stock < 1 ? 'Sold out' : `+ ${t('add')}`}
          </button>

          {user?.role === 'buyer' && (
            <button
              type="button"
              className={`wish-btn ${wished ? 'active' : ''}`}
              onClick={() => toggleWish(p._id)}
              aria-pressed={wished}
              aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
              title={wished ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              {wished ? '♥' : '♡'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
