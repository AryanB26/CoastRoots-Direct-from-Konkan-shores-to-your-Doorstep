import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, inr } from '../api.js';
import { useStore } from '../store.jsx';

const STEPS = [
  { key: 'placed', label: 'Placed', num: '1' },
  { key: 'packed', label: 'Packed', num: '2' },
  { key: 'shipped', label: 'Shipped', num: '3' },
  { key: 'delivered', label: 'Delivered', num: '4' },
];

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const { say, t } = useStore();

  const load = () => api('/orders/mine').then(setOrders).catch(() => setOrders([]));

  useEffect(() => {
    load();
  }, []);

  const cancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this order? Items will be returned to stock.')) return;
    setCancellingId(id);
    try {
      await api(`/orders/${id}/cancel`, { method: 'PATCH' });
      say('Order cancelled successfully');
      load();
    } catch (e) {
      say(e.message);
    } finally {
      setCancellingId(null);
    }
  };

  if (!orders) {
    return <p className="pad">Loading your orders…</p>;
  }

  if (!orders.length) {
    return (
      <div className="narrow">
        <div className="pad empty" style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)' }}>
          <h2>No orders found yet</h2>
          <p className="muted" style={{ maxWidth: '42ch', margin: '0.5rem auto 1.5rem' }}>
            Your direct-from-Konkan orders will show up here along with live shipping tracking and delivery updates.
          </p>
          <Link to="/shop">
            <button>Start Exploring Konkan Produce</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="narrow">
      <div className="row" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>{t('orders')}</h1>
        <span className="muted" style={{ fontWeight: 600 }}>
          {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed
        </span>
      </div>

      <div className="stack">
        {orders.map((o) => {
          const stepIndex = STEPS.findIndex((s) => s.key === o.status);
          const isCancelled = o.status === 'cancelled';
          const isDelivered = o.status === 'delivered';

          return (
            <article key={o._id} className="order">
              {/* Header */}
              <div className="row" style={{ borderBottom: '1px solid var(--line)', paddingBottom: '0.75rem', marginBottom: '0.8rem' }}>
                <div>
                  <b style={{ fontSize: '1.05rem', color: 'var(--sea-dark)' }}>
                    #{o._id.slice(-6).toUpperCase()}
                  </b>
                  <p className="muted" style={{ fontSize: '0.82rem', marginTop: '0.1em' }}>
                    Placed on {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <b style={{ fontSize: '1.2rem', color: 'var(--ink)' }}>{inr(o.total)}</b>
                  <p className="muted" style={{ fontSize: '0.82rem', margin: 0 }}>
                    {o.payment.method === 'cod' ? 'Cash on Delivery' : 'Online Payment'} ·{' '}
                    <span style={{ color: o.payment.paid ? 'var(--leaf)' : 'var(--laterite)', fontWeight: 600 }}>
                      {o.payment.paid ? '✓ Paid' : 'Payment Pending'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Status Stepper Timeline */}
              {isCancelled ? (
                <div className="err" style={{ margin: '0.8rem 0' }}>
                  ✕ This order was cancelled. Reserved items were returned to inventory.
                </div>
              ) : (
                <ol className="steps">
                  {STEPS.map((s, i) => (
                    <li key={s.key} className={i <= stepIndex ? 'done' : ''}>
                      <span className="step-num">{s.num}</span>
                      <span>{s.label}</span>
                    </li>
                  ))}
                </ol>
              )}

              {/* Items List */}
              <div style={{ background: 'var(--surface-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.8rem 1rem', margin: '1rem 0' }}>
                {o.items.map((i, k) => (
                  <div
                    key={k}
                    className="row"
                    style={{
                      padding: '0.4rem 0',
                      borderBottom: k < o.items.length - 1 ? '1px dashed var(--line)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {i.image && (
                        <img
                          src={i.image}
                          alt={i.name}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: 'var(--radius-sm)',
                            objectFit: 'cover',
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <div>
                        <Link to={`/product/${i.product}`} style={{ fontWeight: 600 }}>
                          {i.name}
                        </Link>
                        <span className="muted" style={{ fontSize: '0.85rem', marginLeft: '0.5em' }}>
                          × {i.qty}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <span style={{ fontWeight: 600 }}>{inr(i.price * i.qty)}</span>
                      {isDelivered && (
                        <Link
                          to={`/product/${i.product}`}
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            color: 'var(--sea)',
                            border: '1px solid var(--sea-border)',
                            borderRadius: 'var(--radius-pill)',
                            padding: '0.2em 0.6em',
                            background: '#fff',
                          }}
                        >
                          Review Product
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Address Preview */}
              {o.address && (
                <p className="muted" style={{ fontSize: '0.82rem', margin: '0.4rem 0' }}>
                  <strong>Delivering to:</strong> {o.address.fullName}, {o.address.line1}, {o.address.city}, {o.address.pincode}
                </p>
              )}

              {/* Actions */}
              {o.status === 'placed' && (
                <div style={{ marginTop: '0.8rem', textAlign: 'right' }}>
                  <button
                    className="ghost"
                    style={{ color: 'var(--laterite)', borderColor: 'var(--line-strong)' }}
                    disabled={cancellingId === o._id}
                    onClick={() => cancel(o._id)}
                  >
                    {cancellingId === o._id ? 'Cancelling…' : 'Cancel Order'}
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
