import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { inr } from '../api.js';

export const shipping = (items) => {
  if (!items.length) return 0;
  const sub = items.reduce((n, i) => n + i.price * i.qty, 0);
  const baseShip = sub >= 999 ? 0 : 60;
  const perishableFee = items.some((i) => i.perishable) ? 80 : 0;
  return baseShip + perishableFee;
};

export default function Cart() {
  const { cart, setQty, remove, t } = useStore();
  const nav = useNavigate();
  const sub = cart.reduce((n, i) => n + i.price * i.qty, 0);
  const hasPerishable = cart.some((i) => i.perishable);
  const shipCost = shipping(cart);
  const freeShipThreshold = 999;
  const freeShipPct = Math.min(100, Math.round((sub / freeShipThreshold) * 100));
  const amountToFree = Math.max(0, freeShipThreshold - sub);

  if (!cart.length) {
    return (
      <div className="narrow">
        <div className="empty" style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)' }}>
          <h2>Your cart is currently empty</h2>
          <p className="muted" style={{ maxWidth: '42ch', margin: '0.5rem auto 1.5rem' }}>
            Explore fresh Devgad Alphonso mangoes, Malvani stone-ground spices, and artisanal coastal preserves.
          </p>
          <Link to="/shop">
            <button>Browse the Konkan Catalog</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="narrow">
      <div className="row" style={{ marginBottom: '1.2rem' }}>
        <h1 style={{ margin: 0 }}>{t('cart')} ({cart.reduce((n, i) => n + i.qty, 0)} items)</h1>
        <Link to="/shop" className="ghost" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
          Continue shopping
        </Link>
      </div>

      {/* Free Shipping Progress Meter */}
      <div className="free-shipping-card">
        <div className="row">
          <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>
            {sub >= freeShipThreshold
              ? 'You have unlocked FREE shipping on standard items!'
              : `Add ${inr(amountToFree)} more to unlock FREE standard shipping!`}
          </span>
          <span style={{ fontSize: '0.82rem', color: 'var(--muted)', fontWeight: 600 }}>
            {freeShipPct}%
          </span>
        </div>
        <div className="free-shipping-bar">
          <div className="free-shipping-fill" style={{ width: `${freeShipPct}%` }} />
        </div>
      </div>

      {/* Cart Items List */}
      <div className="cart-items-card">
        {cart.map((i) => (
          <div key={i._id} className="line">
            <div className="cart-thumb">
              {i.image ? (
                <img src={i.image} alt={i.name} />
              ) : (
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Item</span>
              )}
            </div>

            <div>
              <Link to={`/product/${i._id}`} style={{ fontWeight: 600, color: 'var(--ink)' }}>
                {i.name}
              </Link>
              <div className="row" style={{ justifyContent: 'flex-start', gap: '0.5rem', marginTop: '0.2rem' }}>
                <span className="muted">{inr(i.price)} each</span>
                {i.perishable && (
                  <span className="tag perishable" style={{ fontSize: '0.68rem', padding: '0.1em 0.5em' }}>
                    Express Perishable
                  </span>
                )}
              </div>
            </div>

            {/* Quantity Stepper */}
            <div className="stepper" aria-label={`Quantity for ${i.name}`}>
              <button
                type="button"
                disabled={i.qty <= 1}
                onClick={() => setQty(i._id, i.qty - 1)}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span>{i.qty}</span>
              <button
                type="button"
                disabled={i.qty >= i.stock}
                onClick={() => setQty(i._id, i.qty + 1)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <strong>{inr(i.price * i.qty)}</strong>

            <button
              type="button"
              className="ghost"
              style={{ color: 'var(--laterite)', borderColor: 'transparent', padding: '0.4em' }}
              onClick={() => remove(i._id)}
              title="Remove from cart"
              aria-label={`Remove ${i.name} from cart`}
            >
              ✕
            </button>
          </div>
        ))}

        {/* Cost Summary Breakdown */}
        <div className="sum">
          <p>
            {t('subtotal')} <b>{inr(sub)}</b>
          </p>

          <p>
            Standard Shipping{' '}
            <b>{sub >= freeShipThreshold ? <span style={{ color: 'var(--leaf)' }}>FREE</span> : inr(60)}</b>
          </p>

          {hasPerishable && (
            <p>
              Perishable Express Handling <b>{inr(80)}</b>
            </p>
          )}

          <p className="muted" style={{ fontSize: '0.82rem' }}>
            {hasPerishable
              ? 'Perishable items (e.g. fresh mangoes) include ₹80 cold/express handling.'
              : 'Free delivery on all orders over ₹999.'}
          </p>

          <p className="total">
            Total to pay <b>{inr(sub + shipCost)}</b>
          </p>

          <button
            style={{ width: '100%', marginTop: '0.8rem', padding: '0.75em' }}
            onClick={() => nav('/checkout')}
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
