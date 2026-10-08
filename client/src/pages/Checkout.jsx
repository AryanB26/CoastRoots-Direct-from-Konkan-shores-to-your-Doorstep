import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, inr } from '../api.js';
import { useStore } from '../store.jsx';
import { shipping } from './Cart.jsx';

const loadRzp = () =>
  new Promise((res) => {
    if (window.Razorpay) return res(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => res(true);
    s.onerror = () => res(false);
    document.body.appendChild(s);
  });

export default function Checkout() {
  const { cart, clearCart, say, user, t } = useStore();
  const nav = useNavigate();
  const [a, setA] = useState({
    fullName: user?.name || '',
    phone: '',
    line1: '',
    city: '',
    state: 'Maharashtra',
    pincode: '',
  });
  const [method, setMethod] = useState('cod');
  const [pin, setPin] = useState(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const sub = cart.reduce((n, i) => n + i.price * i.qty, 0);
  const shipCost = shipping(cart);
  const total = sub + shipCost;
  const hasPerishable = cart.some((i) => i.perishable);

  const set = (k) => (e) => setA({ ...a, [k]: e.target.value });

  // Auto-check pincode whenever 6 valid digits are typed
  useEffect(() => {
    const code = a.pincode.trim();
    if (/^[1-9][0-9]{5}$/.test(code)) {
      setPinLoading(true);
      api(`/orders/pincode/${code}`)
        .then(setPin)
        .catch((e) => setPin({ error: e.message }))
        .finally(() => setPinLoading(false));
    } else {
      setPin(null);
    }
  }, [a.pincode]);

  const place = async (e) => {
    e.preventDefault();
    if (hasPerishable && pin && !pin.perishableOk) {
      return say('Perishable items (like fresh mangoes) cannot be delivered to this pincode.');
    }
    setBusy(true);
    try {
      const { order, razorpay } = await api('/orders', {
        method: 'POST',
        body: {
          items: cart.map((i) => ({ product: i._id, qty: i.qty })),
          address: a,
          method,
        },
      });

      if (razorpay) {
        if (!(await loadRzp())) throw new Error('Could not load the online payment window');
        await new Promise((resolve, reject) =>
          new window.Razorpay({
            key: razorpay.keyId,
            amount: razorpay.amount,
            currency: 'INR',
            name: 'CoastRoots',
            description: 'Direct Konkan Shore Delivery',
            order_id: razorpay.orderId,
            prefill: {
              name: a.fullName,
              contact: a.phone,
            },
            handler: async (r) => {
              try {
                await api(`/orders/${order._id}/verify`, { method: 'POST', body: r });
                resolve();
              } catch (er) {
                reject(er);
              }
            },
            modal: {
              ondismiss: () =>
                reject(new Error('Payment window closed. You can complete payment from My Orders.')),
            },
          }).open()
        );
      }

      clearCart();
      say('Order placed successfully!');
      nav('/orders');
    } catch (err) {
      say(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!cart.length) {
    return (
      <div className="narrow pad empty">
        <h2>Your cart is empty</h2>
        <p className="muted">Add some Konkan specialties before proceeding to checkout.</p>
        <Link to="/shop">
          <button style={{ marginTop: '1rem' }}>Shop Now</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="checkout-layout">
      {/* Left Column: Delivery & Payment Details Form */}
      <div>
        <form onSubmit={place} className="checkout-card stack">
          <h1 style={{ marginTop: 0, fontSize: '1.8rem' }}>Delivery & Payment</h1>

          <div>
            <label>Full Name</label>
            <input
              required
              placeholder="e.g. Anand Satam"
              value={a.fullName}
              onChange={set('fullName')}
            />
          </div>

          <div>
            <label>Mobile Number (10 digits)</label>
            <input
              required
              pattern="[0-9]{10}"
              placeholder="e.g. 9820012345"
              title="10-digit mobile number"
              value={a.phone}
              onChange={set('phone')}
            />
          </div>

          <div>
            <label>Street Address</label>
            <input
              required
              placeholder="House/flat no., building name, street or wadi"
              value={a.line1}
              onChange={set('line1')}
            />
          </div>

          <div className="two">
            <div>
              <label>City / Town</label>
              <input
                required
                placeholder="e.g. Mumbai, Pune, Ratnagiri"
                value={a.city}
                onChange={set('city')}
              />
            </div>
            <div>
              <label>State</label>
              <input
                required
                value={a.state}
                onChange={set('state')}
              />
            </div>
          </div>

          <div>
            <label>Pincode (6 digits)</label>
            <input
              required
              pattern="[1-9][0-9]{5}"
              placeholder="e.g. 400001 or 416601"
              value={a.pincode}
              onChange={set('pincode')}
            />
            {pinLoading && <p className="muted" style={{ fontSize: '0.82rem', marginTop: '0.3em' }}>Checking delivery speed…</p>}
            {pin && !pinLoading && (
              <p className={pin.error || (hasPerishable && !pin.perishableOk) ? 'err' : 'ok'} style={{ fontSize: '0.88rem' }}>
                {pin.error
                  ? pin.error
                  : hasPerishable && !pin.perishableOk
                  ? 'Perishable produce (like fresh Alphonso mangoes) cannot be delivered to this pincode. Express 2-day delivery is required.'
                  : `Serviceable: Estimated delivery in ${pin.days} business days.${pin.perishableOk ? ' Express perishable shipping supported.' : ''}`}
              </p>
            )}
          </div>

          {/* Payment Selection */}
          <fieldset style={{ marginTop: '0.8rem' }}>
            <legend>Select Payment Method</legend>
            <div className="payment-options">
              <label
                className={`payment-card ${method === 'cod' ? 'active' : ''}`}
                onClick={() => setMethod('cod')}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={method === 'cod'}
                  onChange={() => setMethod('cod')}
                  style={{ width: 'auto' }}
                />
                <div>
                  <strong>Cash on Delivery (COD)</strong>
                  <p className="muted" style={{ fontSize: '0.82rem', margin: 0 }}>
                    Pay at your doorstep upon receiving your parcel
                  </p>
                </div>
              </label>

              <label
                className={`payment-card ${method === 'razorpay' ? 'active' : ''}`}
                onClick={() => setMethod('razorpay')}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={method === 'razorpay'}
                  onChange={() => setMethod('razorpay')}
                  style={{ width: 'auto' }}
                />
                <div>
                  <strong>Online Payment via Razorpay</strong>
                  <p className="muted" style={{ fontSize: '0.82rem', margin: 0 }}>
                    UPI (Google Pay, PhonePe), Cards, Netbanking
                  </p>
                </div>
              </label>
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={busy || (hasPerishable && pin && !pin.perishableOk)}
            style={{ width: '100%', padding: '0.85em', fontSize: '1.05rem', marginTop: '0.5rem' }}
          >
            {busy ? 'Processing your order…' : `Confirm Order · ${inr(total)}`}
          </button>
        </form>
      </div>

      {/* Right Column: Order Summary Card */}
      <aside className="order-summary-sticky">
        <h3 style={{ borderBottom: '1px solid var(--line)', paddingBottom: '0.6rem', marginTop: 0 }}>
          Order Summary ({cart.reduce((n, i) => n + i.qty, 0)} items)
        </h3>

        <div style={{ maxHeight: '240px', overflowY: 'auto', margin: '0.8rem 0' }}>
          {cart.map((i) => (
            <div key={i._id} className="summary-row">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                {i.image && (
                  <img
                    src={i.image}
                    alt={i.name}
                    style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }}
                  />
                )}
                <span>{i.name}</span> <small style={{ color: 'var(--muted)' }}>× {i.qty}</small>
              </span>
              <strong>{inr(i.price * i.qty)}</strong>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--line)', paddingTop: '0.8rem', marginTop: '0.8rem' }}>
          <div className="summary-row">
            <span>{t('subtotal')}</span>
            <span>{inr(sub)}</span>
          </div>

          <div className="summary-row">
            <span>Standard Shipping</span>
            <span>{sub >= 999 ? <strong style={{ color: 'var(--leaf)' }}>FREE</strong> : inr(60)}</span>
          </div>

          {hasPerishable && (
            <div className="summary-row">
              <span>Perishable Express Handling</span>
              <span>{inr(80)}</span>
            </div>
          )}

          <div className="summary-row" style={{ fontSize: '1.2rem', fontWeight: 700, borderTop: '1px solid var(--line)', paddingTop: '0.8rem', marginTop: '0.5rem', color: 'var(--sea-dark)' }}>
            <span>Total to pay</span>
            <span>{inr(total)}</span>
          </div>
        </div>

        <div style={{ background: 'var(--surface-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.8rem', marginTop: '1.2rem', fontSize: '0.8rem', color: 'var(--muted)', display: 'grid', gap: '0.4rem' }}>
          <div>• Direct from Konkan farmers & producers</div>
          <div>• Careful packaging in paddy straw & eco boxes</div>
          <div>• Authentic quality guarantee</div>
        </div>
      </aside>
    </div>
  );
}
