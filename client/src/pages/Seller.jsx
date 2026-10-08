import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { api, inr, MONTHS } from '../api.js';
import { useStore } from '../store.jsx';

const CATEGORY_PRESETS = ['Fruits', 'Spices', 'Dry Fruits', 'Dried Fish', 'Pantry', 'Beverages', 'Ready Mixes'];

const blank = {
  name: '',
  description: '',
  category: '',
  price: '',
  unit: 'pack',
  stock: 0,
  image: '',
  perishable: false,
  seasonFrom: '',
  seasonTo: '',
};

export default function Seller() {
  const { user, say } = useStore();
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const approved = user.seller?.approved;

  const load = () => {
    api('/products/mine/list').then(setProducts).catch(() => {});
    api('/orders/seller').then(setOrders).catch(() => {});
    api('/orders/seller/analytics').then(setStats).catch(() => {});
  };

  useEffect(load, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const body = {
      ...form,
      price: +form.price,
      stock: +form.stock,
      seasonFrom: +form.seasonFrom || null,
      seasonTo: +form.seasonTo || null,
    };
    try {
      await api(form._id ? `/products/${form._id}` : '/products', {
        method: form._id ? 'PUT' : 'POST',
        body,
      });
      say(form._id ? 'Product updated successfully' : 'Product submitted for admin approval');
      setForm(null);
      load();
    } catch (er) {
      say(er.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api(`/products/${id}`, { method: 'DELETE' });
        say('Product deleted');
        load();
      } catch (er) {
        say(er.message);
      }
    }
  };

  const setStatus = async (id, status) => {
    try {
      await api(`/orders/${id}/status`, { method: 'PATCH', body: { status } });
      say(`Order updated to: ${status}`);
      load();
    } catch (er) {
      say(er.message);
    }
  };

  const f = (k) => (e) =>
    setForm({
      ...form,
      [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    });

  return (
    <div className="wide">
      <div className="row" style={{ borderBottom: '1px solid var(--line)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>{user.seller?.shopName}</h1>
          <p className="muted" style={{ marginTop: '0.2em' }}>
            {user.seller?.village}, {user.seller?.district} · Producer Portal
          </p>
        </div>

        <div>
          {approved ? (
            <span className="tag on" style={{ fontSize: '0.85rem', padding: '0.4em 0.9em' }}>
              Approved Producer
            </span>
          ) : (
            <span className="tag off" style={{ fontSize: '0.85rem', padding: '0.4em 0.9em' }}>
              Awaiting Admin Approval
            </span>
          )}
        </div>
      </div>

      {!approved && (
        <div className="notice" style={{ marginBottom: '1.5rem' }}>
          <strong>Account Pending Verification:</strong> Your seller profile is being verified by the CoastRoots admin.
          You can preview your catalog, but new items will be published once verified.
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {['products', 'orders', 'analytics'].map((t) => (
          <button
            key={t}
            className={tab === t ? '' : 'ghost'}
            onClick={() => {
              setTab(t);
              setForm(null);
            }}
          >
            {t === 'products' ? 'Products' : t === 'orders' ? 'Customer Orders' : 'Sales Analytics'}
          </button>
        ))}
      </div>

      {/* TAB 1: Products */}
      {tab === 'products' && !form && (
        <>
          <div className="row" style={{ margin: '1rem 0' }}>
            <p className="muted" style={{ fontWeight: 600 }}>
              {products.length} products listed
            </p>
            <button disabled={!approved} onClick={() => setForm({ ...blank })}>
              + Add New Product
            </button>
          </div>

          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
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
                        <strong>{p.name}</strong>
                        {p.perishable && (
                          <span className="tag perishable" style={{ fontSize: '0.65rem', marginLeft: '0.5em' }}>
                            Express Perishable
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{p.category}</td>
                  <td>{inr(p.price)} / {p.unit}</td>
                  <td>
                    <span style={{ color: p.stock < 5 ? 'var(--laterite)' : 'var(--leaf)', fontWeight: 600 }}>
                      {p.stock} units
                    </span>
                  </td>
                  <td>
                    <span className={p.approved ? 'tag on' : 'tag off'}>
                      {p.approved ? 'Live in Shop' : 'Pending Review'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="ghost"
                      style={{ padding: '0.3em 0.7em', marginRight: '0.4em' }}
                      onClick={() =>
                        setForm({
                          ...p,
                          seasonFrom: p.seasonFrom || '',
                          seasonTo: p.seasonTo || '',
                          image: p.image || '',
                        })
                      }
                    >
                      Edit
                    </button>
                    <button
                      className="ghost"
                      style={{ padding: '0.3em 0.7em', color: 'var(--laterite)' }}
                      onClick={() => del(p._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {products.length === 0 && (
            <div className="pad empty">
              <h3>No products in your catalog yet</h3>
              <p className="muted">List your Alphonso harvest, coastal spices, or homemade specialties.</p>
            </div>
          )}
        </>
      )}

      {/* Product Form (Add / Edit) */}
      {tab === 'products' && form && (
        <form className="stack small" style={{ maxWidth: '640px', margin: '1rem auto' }} onSubmit={save}>
          <div className="row">
            <h2>{form._id ? 'Edit Product' : 'Add New Konkan Product'}</h2>
            <button type="button" className="ghost" onClick={() => setForm(null)}>
              Cancel
            </button>
          </div>

          <label>
            Product Name *
            <input required placeholder="e.g. Devgad Alphonso Mangoes (12 pcs)" value={form.name} onChange={f('name')} />
          </label>

          <label>
            Detailed Description
            <textarea
              rows="3"
              placeholder="Describe origin, harvest method, flavour profile, or preservation technique…"
              value={form.description || ''}
              onChange={f('description')}
            />
          </label>

          <div className="two">
            <label>
              Category *
              <input
                required
                list="category-suggestions"
                placeholder="e.g. Fruits, Spices…"
                value={form.category}
                onChange={f('category')}
              />
              <datalist id="category-suggestions">
                {CATEGORY_PRESETS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>

            <label>
              Packaging Unit *
              <input placeholder="e.g. 500 g, 1 kg, box of 12" value={form.unit} onChange={f('unit')} />
            </label>
          </div>

          <div className="two">
            <label>
              Price (₹) *
              <input type="number" min="0" required placeholder="450" value={form.price} onChange={f('price')} />
            </label>

            <label>
              Available Stock *
              <input type="number" min="0" value={form.stock} onChange={f('stock')} />
            </label>
          </div>

          <label>
            Image URL (optional)
            <input placeholder="https://example.com/photo.jpg" value={form.image || ''} onChange={f('image')} />
          </label>

          <div className="two">
            <label>
              Season Starts
              <select value={form.seasonFrom} onChange={f('seasonFrom')}>
                <option value="">Year-round</option>
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Season Ends
              <select value={form.seasonTo} onChange={f('seasonTo')}>
                <option value="">Year-round</option>
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="check" style={{ background: 'var(--surface-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <input type="checkbox" checked={!!form.perishable} onChange={f('perishable')} />
            <span>Mark as Perishable (requires 48h express delivery, e.g. fresh mangoes)</span>
          </label>

          <div className="row" style={{ marginTop: '1rem' }}>
            <button disabled={saving}>{saving ? 'Saving…' : 'Save Product'}</button>
            <button type="button" className="ghost" onClick={() => setForm(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Orders Fulfillment */}
      {tab === 'orders' && (
        <div>
          <p className="muted" style={{ fontWeight: 600, margin: '1rem 0' }}>
            {orders.length} orders requiring fulfillment
          </p>

          {orders.length === 0 ? (
            <div className="pad empty">
              <h3>No customer orders yet</h3>
              <p className="muted">Orders placed for your items will appear here with shipping addresses and status controls.</p>
            </div>
          ) : (
            orders.map((o) => {
              const sellerTotal = o.items.reduce((sum, item) => sum + item.price * item.qty, 0);

              return (
                <article key={o._id} className="order">
                  <div className="row" style={{ borderBottom: '1px solid var(--line)', paddingBottom: '0.75rem', marginBottom: '0.8rem' }}>
                    <div>
                      <b style={{ fontSize: '1.05rem', color: 'var(--sea-dark)' }}>
                        Order #{o._id.slice(-6).toUpperCase()}
                      </b>
                      <p className="muted" style={{ fontSize: '0.82rem', marginTop: '0.1em' }}>
                        Customer: <strong>{o.buyer?.name}</strong> {o.buyer?.email ? `(${o.buyer?.email})` : ''} · Contact: <strong>{o.address?.phone || 'N/A'}</strong>
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <b style={{ fontSize: '1.15rem' }}>{inr(sellerTotal)}</b>
                      <span className="muted" style={{ fontSize: '0.8rem', display: 'block' }}>
                        ({o.items.reduce((s, i) => s + i.qty, 0)} units for your shop)
                      </span>
                    </div>
                  </div>

                  {/* Dispatch Address */}
                  {o.address && (
                    <div style={{ background: 'var(--sea-surface)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginBottom: '0.8rem', fontSize: '0.88rem' }}>
                      <strong>Ship to:</strong> {o.address.fullName}, {o.address.line1}, {o.address.city}, {o.address.state} — <strong>Pincode: {o.address.pincode}</strong>
                    </div>
                  )}

                  {/* Seller Items */}
                  <div style={{ margin: '0.8rem 0' }}>
                    {o.items.map((i, k) => (
                      <p key={k} style={{ margin: '0.3em 0' }}>
                        <strong>{i.name}</strong> × {i.qty} units ({inr(i.price * i.qty)})
                      </p>
                    ))}
                  </div>

                  {/* Fulfillment Status Selector */}
                  <div className="row" style={{ borderTop: '1px solid var(--line)', paddingTop: '0.8rem', marginTop: '0.8rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <span>Update Fulfillment:</span>
                      <select
                        style={{ width: 'auto', fontWeight: 600 }}
                        value={o.status}
                        onChange={(e) => setStatus(o._id, e.target.value)}
                      >
                        <option value="placed">Placed (New)</option>
                        <option value="packed">Packed (Ready for pickup)</option>
                        <option value="shipped">Shipped (In transit)</option>
                        <option value="delivered">Delivered (Handed to buyer)</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </label>

                    <span className={`tag ${o.status === 'delivered' ? 'on' : o.status === 'cancelled' ? 'off' : 'neutral'}`}>
                      Current: {o.status}
                    </span>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: Analytics */}
      {tab === 'analytics' && stats && (
        <div>
          <div className="kpis">
            <div>
              <b>{inr(stats.revenue)}</b>
              <span>Total Gross Sales</span>
            </div>
            <div>
              <b>{stats.orders}</b>
              <span>Total Orders</span>
            </div>
            <div>
              <b>{inr(stats.forecastNextMonth)}</b>
              <span>Next Month Projection</span>
            </div>
          </div>

          <h2>Monthly Revenue Trend</h2>
          {stats.series.length ? (
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.series}>
                  <XAxis dataKey="month" stroke="var(--muted)" />
                  <YAxis stroke="var(--muted)" tickFormatter={(v) => `₹${v}`} />
                  <Tooltip formatter={(value) => [inr(value), 'Revenue']} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0E3B43"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#0E3B43' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="pad empty">Revenue trends will graph automatically once sales occur.</p>
          )}

          <h2>Top Selling Specialties</h2>
          {stats.topProducts.length > 0 ? (
            <div className="chart" style={{ marginTop: '1rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topProducts}>
                  <XAxis dataKey="name" stroke="var(--muted)" />
                  <YAxis allowDecimals={false} stroke="var(--muted)" />
                  <Tooltip formatter={(value) => [value, 'Units Sold']} />
                  <Bar dataKey="units" fill="#F0A532" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="pad empty">Product rankings appear after sales.</p>
          )}
        </div>
      )}
    </div>
  );
}
