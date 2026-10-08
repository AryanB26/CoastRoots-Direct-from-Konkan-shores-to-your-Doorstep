import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, inr, inSeason, MONTHS } from '../api.js';
import { useStore } from '../store.jsx';
import ProductCard from '../components/ProductCard.jsx';

export default function Product() {
  const { id } = useParams();
  const { addToCart, user, t, say, toggleWish } = useStore();
  const [p, setP] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [recs, setRecs] = useState([]);
  const [qty, setQty] = useState(1);
  const [imgError, setImgError] = useState(false);
  const [rv, setRv] = useState({ rating: 5, comment: '' });
  const [postingReview, setPostingReview] = useState(false);

  const load = () => {
    api(`/products/${id}`).then(setP).catch(() => setP(false));
    api(`/reviews/${id}`).then(setReviews).catch(() => setReviews([]));
    api(`/products/${id}/recommendations`).then(setRecs).catch(() => setRecs([]));
  };

  useEffect(() => {
    load();
    setQty(1);
    setImgError(false);
    window.scrollTo(0, 0);
  }, [id]);

  const submit = async (e) => {
    e.preventDefault();
    setPostingReview(true);
    try {
      await api(`/reviews/${id}`, { method: 'POST', body: rv });
      say('Thank you! Review posted successfully');
      setRv({ rating: 5, comment: '' });
      load();
    } catch (err) {
      say(err.message);
    } finally {
      setPostingReview(false);
    }
  };

  if (p === false) {
    return (
      <div className="pad empty">
        <h2>Product not found</h2>
        <p className="muted">This Konkan item may have been discontinued or unpublished.</p>
        <Link to="/shop" style={{ marginTop: '1rem', display: 'inline-block' }}>
          Back to the store
        </Link>
      </div>
    );
  }

  if (!p) {
    return <p className="pad">Loading product details…</p>;
  }

  const season = inSeason(p);
  const s = p.seller?.seller;
  const wished = user?.wishlist?.includes(p._id);

  return (
    <div className="detail">
      {/* Breadcrumbs */}
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/shop">Shop</Link>
        <span>›</span>
        <span>{p.category}</span>
        <span>›</span>
        <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{p.name}</span>
      </nav>

      <div className="pd">
        <div className="tile big" style={{ position: 'relative' }}>
          {p.image && !imgError ? (
            <img
              src={p.image}
              alt={p.name}
              onError={() => setImgError(true)}
            />
          ) : (
            <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>No image available</span>
          )}

          <div style={{ position: 'absolute', top: '1rem', left: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', zIndex: 2 }}>
            {season !== null && (
              <span className={season ? 'tag on' : 'tag off'} style={{ fontSize: '0.82rem', padding: '0.3em 0.8em' }}>
                {season ? t('inSeason') : t('offSeason')}
              </span>
            )}
            {p.perishable && (
              <span className="tag perishable" style={{ fontSize: '0.82rem', padding: '0.3em 0.8em' }}>
                Express Perishable
              </span>
            )}
          </div>
        </div>

        <div>
          {s?.shopName && (
            <p className="muted" style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>
              Produced by {s.shopName}
            </p>
          )}

          <h1 style={{ marginTop: '0.1em' }}>{p.name}</h1>

          <div className="row" style={{ justifyContent: 'flex-start', gap: '1rem', margin: '0.5rem 0' }}>
            <p className="price" style={{ margin: 0 }}>
              {inr(p.price)} <small>/ {p.unit}</small>
            </p>
            {p.numReviews > 0 && (
              <span className="tag neutral" style={{ fontSize: '0.85rem' }}>
                Rating {p.ratingAvg} ({p.numReviews} verified reviews)
              </span>
            )}
          </div>

          {season !== null && (
            <p style={{ margin: '0.5rem 0', fontSize: '0.92rem' }}>
              <strong>Harvest Window:</strong> {MONTHS[p.seasonFrom - 1]} to {MONTHS[p.seasonTo - 1]}
            </p>
          )}

          <p style={{ color: 'var(--muted)', fontSize: '1rem', lineHeight: 1.6, margin: '1rem 0' }}>
            {p.description}
          </p>

          <dl className="facts">
            <dt>Origin</dt>
            <dd>{p.village ? `${p.village}, ` : ''}{p.district}, Maharashtra</dd>

            {p.batchDate && (
              <>
                <dt>Batch Date</dt>
                <dd>{new Date(p.batchDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</dd>
              </>
            )}

            <dt>Logistics</dt>
            <dd>
              {p.perishable
                ? 'Perishable: 48-hr express delivery with temperature-safe packing (+₹80 handling)'
                : 'Non-perishable: Standard courier shipping (3–5 days)'}
            </dd>

            <dt>Availability</dt>
            <dd>
              {p.stock > 10 ? (
                <span style={{ color: 'var(--leaf)', fontWeight: 600 }}>In stock ({p.stock} units available)</span>
              ) : p.stock > 0 ? (
                <span style={{ color: 'var(--laterite)', fontWeight: 600 }}>Low stock: Only {p.stock} units remaining</span>
              ) : (
                <span style={{ color: 'var(--laterite)', fontWeight: 600 }}>Currently sold out</span>
              )}
            </dd>
          </dl>

          {/* Quantity and Actions */}
          <div className="row" style={{ marginTop: '1.5rem', gap: '1rem' }}>
            {p.stock > 0 && (
              <div className="stepper" aria-label="Select quantity">
                <button
                  type="button"
                  disabled={qty <= 1}
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span>{qty}</span>
                <button
                  type="button"
                  disabled={qty >= p.stock}
                  onClick={() => setQty((q) => Math.min(p.stock, q + 1))}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            )}

            <button
              style={{ flex: 1, padding: '0.7em 1.5em' }}
              disabled={p.stock < 1}
              onClick={() => addToCart(p, qty)}
            >
              {p.stock < 1 ? 'Out of stock' : `${t('add')} (${inr(p.price * qty)})`}
            </button>

            {user?.role === 'buyer' && (
              <button
                type="button"
                className={`wish-btn ${wished ? 'active' : ''}`}
                style={{ width: '2.8rem', height: '2.8rem' }}
                onClick={() => toggleWish(p._id)}
                title={wished ? 'Remove from wishlist' : 'Save to wishlist'}
              >
                {wished ? '♥' : '♡'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Meet the Producer Card */}
      {s && (
        <section className="story">
          <h2>Meet the Producer: {s.shopName}</h2>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.6, color: 'var(--ink)' }}>
            "{s.story}"
          </p>
          <p className="muted" style={{ fontWeight: 600 }}>
            Based in {s.village}, {s.district} district
          </p>
        </section>
      )}

      {/* Reviews Section */}
      <section className="reviews-section">
        <h2>
          Verified Customer Reviews{' '}
          {p.numReviews > 0 && <small>Rating: {p.ratingAvg} from {p.numReviews} reviews</small>}
        </h2>

        {reviews.length === 0 ? (
          <p className="muted" style={{ padding: '1rem 0' }}>
            No reviews yet. Customers who receive this product can leave verified feedback here.
          </p>
        ) : (
          <div>
            {reviews.map((r) => (
              <article key={r._id} className="review">
                <div className="review-header">
                  <strong>{r.userName}</strong>
                  <span className="stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  <span className={`tag ${r.sentiment}`}>
                    {r.sentiment === 'positive' ? 'Positive' : r.sentiment === 'negative' ? 'Critical' : 'Neutral'}
                  </span>
                </div>
                <p style={{ margin: '0.3em 0', color: 'var(--ink)' }}>{r.comment}</p>
              </article>
            ))}
          </div>
        )}

        {user?.role === 'buyer' && (
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--line)', paddingTop: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.4rem' }}>Have you received this product?</h3>
            <p className="muted" style={{ marginBottom: '1rem', fontSize: '0.88rem' }}>
              Reviews can be submitted by verified purchasers once your order is marked as delivered.
            </p>

            <form onSubmit={submit} className="stack small">
              <label>
                Rating
                <select
                  value={rv.rating}
                  onChange={(e) => setRv({ ...rv, rating: +e.target.value })}
                >
                  <option value={5}>★★★★★ 5 - Excellent</option>
                  <option value={4}>★★★★☆ 4 - Good</option>
                  <option value={3}>★★★☆☆ 3 - Average</option>
                  <option value={2}>★★☆☆☆ 2 - Subpar</option>
                  <option value={1}>★☆☆☆☆ 1 - Disappointed</option>
                </select>
              </label>

              <label>
                Your experience & feedback
                <textarea
                  required
                  rows="3"
                  placeholder="Tell others about the freshness, taste, and packaging…"
                  value={rv.comment}
                  onChange={(e) => setRv({ ...rv, comment: e.target.value })}
                />
              </label>

              <button disabled={postingReview}>
                {postingReview ? 'Submitting…' : 'Post Verified Review'}
              </button>
            </form>
          </div>
        )}
      </section>

      {/* Recommendations */}
      {recs.length > 0 && (
        <section style={{ marginTop: '3rem' }}>
          <h2>Pairs well with other Konkan favorites</h2>
          <div className="grid">
            {recs.map((r) => (
              <ProductCard key={r._id} p={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
