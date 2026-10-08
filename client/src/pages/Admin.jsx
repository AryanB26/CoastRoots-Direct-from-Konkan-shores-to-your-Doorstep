import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, inr } from '../api.js';
import { useStore } from '../store.jsx';

export default function Admin() {
  const { say } = useStore();
  const [stats, setStats] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('sellers');
  const [onlyPending, setOnlyPending] = useState(false);

  const load = () => {
    api('/admin/stats').then(setStats).catch(() => {});
    api('/admin/sellers').then(setSellers).catch(() => {});
    api('/admin/products').then(setProducts).catch(() => {});
    api('/admin/orders').then(setOrders).catch(() => {});
  };

  useEffect(load, []);

  const sellerOk = async (id, approved) => {
    try {
      await api(`/admin/sellers/${id}`, { method: 'PATCH', body: { approved } });
      say(approved ? 'Seller approved' : 'Seller suspended');
      load();
    } catch (e) {
      say(e.message);
    }
  };

  const prodOk = async (id, approved) => {
    try {
      await api(`/admin/products/${id}`, { method: 'PATCH', body: { approved } });
      say(approved ? 'Product approved & published' : 'Product unpublished');
      load();
    } catch (e) {
      say(e.message);
    }
  };

  const filteredSellers = onlyPending ? sellers.filter((s) => !s.seller?.approved) : sellers;
  const filteredProducts = onlyPending ? products.filter((p) => !p.approved) : products;

  return (
    <div className="wide">
      <div className="row" style={{ borderBottom: '1px solid var(--line)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>CoastRoots Platform Administration</h1>
          <p className="muted" style={{ marginTop: '0.2em' }}>
            Konkan Producer Approvals, Catalog Management, and Sales Monitoring
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      {stats && (
        <div className="kpis">
          <div>
            <b>{stats.users}</b>
            <span>Registered Buyers</span>
          </div>
          <div>
            <b>{stats.sellers}</b>
            <span>Konkan Producers</span>
          </div>
          <div>
            <b>{stats.products}</b>
            <span>Catalog Items</span>
          </div>
          <div>
            <b>{stats.orders}</b>
            <span>Total Orders</span>
          </div>
          <div>
            <b>{inr(stats.revenue)}</b>
            <span>Platform GMV</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="row" style={{ marginTop: '2rem' }}>
        <div className="tabs" style={{ margin: 0 }}>
          <button className={tab === 'sellers' ? '' : 'ghost'} onClick={() => setTab('sellers')}>
            Producers ({sellers.filter((s) => !s.seller?.approved).length} pending)
          </button>
          <button className={tab === 'products' ? '' : 'ghost'} onClick={() => setTab('products')}>
            Products ({products.filter((p) => !p.approved).length} pending)
          </button>
          <button className={tab === 'orders' ? '' : 'ghost'} onClick={() => setTab('orders')}>
            Recent Orders ({orders.length})
          </button>
        </div>

        {tab !== 'orders' && (
          <label className="check" style={{ fontSize: '0.88rem' }}>
            <input
              type="checkbox"
              checked={onlyPending}
              onChange={(e) => setOnlyPending(e.target.checked)}
            />
            <span>Show pending review only</span>
          </label>
        )}
      </div>

      {/* TAB 1: Sellers */}
      {tab === 'sellers' && (
        <div style={{ marginTop: '1rem' }}>
          <table>
            <thead>
              <tr>
                <th>Producer / Shop</th>
                <th>Contact & Location</th>
                <th>Story Preview</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSellers.map((s) => (
                <tr key={s._id}>
                  <td>
                    <strong>{s.seller?.shopName || s.name}</strong>
                    <div className="muted" style={{ fontSize: '0.82rem' }}>Owner: {s.name}</div>
                  </td>
                  <td>
                    <div>{s.email}</div>
                    <div className="muted" style={{ fontSize: '0.82rem' }}>
                      {s.seller?.village}, {s.seller?.district}
                    </div>
                  </td>
                  <td style={{ maxWidth: '280px', fontSize: '0.85rem' }}>
                    <span className="muted" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {s.seller?.story || 'No narrative provided'}
                    </span>
                  </td>
                  <td>
                    <span className={s.seller?.approved ? 'tag on' : 'tag off'}>
                      {s.seller?.approved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="ghost"
                      style={{
                        padding: '0.35em 0.8em',
                        color: s.seller?.approved ? 'var(--laterite)' : 'var(--leaf)',
                      }}
                      onClick={() => sellerOk(s._id, !s.seller?.approved)}
                    >
                      {s.seller?.approved ? 'Suspend Seller' : 'Approve Seller'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredSellers.length === 0 && (
            <p className="pad empty">No sellers match the selected filter.</p>
          )}
        </div>
      )}

      {/* TAB 2: Products */}
      {tab === 'products' && (
        <div style={{ marginTop: '1rem' }}>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Seller Shop</th>
                <th>Price & Stock</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: 'var(--radius-sm)',
                            objectFit: 'cover',
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <span className="muted" style={{ fontSize: '0.8rem' }}>Item</span>
                      )}
                      <div>
                        <Link to={`/product/${p._id}`} style={{ fontWeight: 600 }}>
                          {p.name}
                        </Link>
                        <div className="muted" style={{ fontSize: '0.82rem' }}>
                          Category: {p.category} {p.perishable ? '· Perishable' : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <strong>{p.seller?.seller?.shopName || 'Unknown Shop'}</strong>
                  </td>
                  <td>
                    <div>{inr(p.price)} / {p.unit}</div>
                    <div className="muted" style={{ fontSize: '0.82rem' }}>Stock: {p.stock} units</div>
                  </td>
                  <td>
                    <span className={p.approved ? 'tag on' : 'tag off'}>
                      {p.approved ? 'Live' : 'Pending'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="ghost"
                      style={{
                        padding: '0.35em 0.8em',
                        color: p.approved ? 'var(--laterite)' : 'var(--leaf)',
                      }}
                      onClick={() => prodOk(p._id, !p.approved)}
                    >
                      {p.approved ? 'Unpublish' : 'Approve Item'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <p className="pad empty">No products match the selected filter.</p>
          )}
        </div>
      )}

      {/* TAB 3: Orders */}
      {tab === 'orders' && (
        <div style={{ marginTop: '1rem' }}>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Buyer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td>
                    <strong>#{o._id.slice(-6).toUpperCase()}</strong>
                  </td>
                  <td>
                    <div>{o.buyer?.name}</div>
                    <div className="muted" style={{ fontSize: '0.82rem' }}>{o.buyer?.email}</div>
                  </td>
                  <td>
                    {new Date(o.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td>
                    <strong>{inr(o.total)}</strong>
                    <div className="muted" style={{ fontSize: '0.78rem' }}>
                      {o.payment?.method === 'cod' ? 'COD' : 'Online'} · {o.payment?.paid ? 'Paid' : 'Pending'}
                    </div>
                  </td>
                  <td>
                    <span className={`tag ${o.status === 'delivered' ? 'on' : o.status === 'cancelled' ? 'off' : 'neutral'}`}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {orders.length === 0 && (
            <p className="pad empty">No orders on the platform yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
