import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useStore } from '../store.jsx';

export default function Auth({ mode }) {
  const { login, say } = useStore();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [f, setF] = useState({
    name: '',
    email: '',
    password: '',
    role: sp.get('role') === 'seller' ? 'seller' : 'buyer',
    shopName: '',
    village: '',
    district: 'Sindhudurg',
    story: '',
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const isReg = mode === 'register';

  const fillDemo = (email) => {
    setF({ ...f, email, password: 'password123' });
    say(`Filled demo credentials for ${email}`);
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const data = await api(`/auth/${mode}`, { method: 'POST', body: f });
      login(data);
      say(`Welcome back, ${data.user.name}!`);
      nav(data.user.role === 'seller' ? '/seller' : data.user.role === 'admin' ? '/admin' : '/shop');
    } catch (er) {
      setErr(er.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="narrow small" style={{ margin: '3rem auto' }}>
      <form
        onSubmit={submit}
        className="stack small"
        style={{
          background: 'var(--surface)',
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--line)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', margin: '0.2em 0 0.1em' }}>
            {isReg ? (f.role === 'seller' ? 'Join as a Konkan Producer' : 'Create CoastRoots Account') : 'Log in to CoastRoots'}
          </h1>
          <p className="muted" style={{ fontSize: '0.88rem' }}>
            {isReg ? 'Connect with genuine coastal artisans & family orchards' : 'Direct access to your orders, cart, and dashboard'}
          </p>
        </div>

        {isReg && (
          <label>
            Your Full Name *
            <input required placeholder="e.g. Ramesh Gawade" value={f.name} onChange={set('name')} />
          </label>
        )}

        <label>
          Email Address *
          <input type="email" required placeholder="you@domain.com" value={f.email} onChange={set('email')} />
        </label>

        <label>
          Password * (min. 6 characters)
          <input type="password" required minLength="6" placeholder="••••••••" value={f.password} onChange={set('password')} />
        </label>

        {isReg && (
          <div>
            <label>Account Type</label>
            <select value={f.role} onChange={set('role')}>
              <option value="buyer">Buyer (Purchase coastal produce)</option>
              <option value="seller">Producer / Seller (Sell Konkan harvest)</option>
            </select>
          </div>
        )}

        {isReg && f.role === 'seller' && (
          <div style={{ background: 'var(--sea-surface)', padding: '1rem', borderRadius: 'var(--radius-sm)', display: 'grid', gap: '0.8rem' }}>
            <label>
              Shop or Farm / Self-Help Group Name *
              <input required placeholder="e.g. Gawade Orchards or Konkan Mahila Bachat Gat" value={f.shopName} onChange={set('shopName')} />
            </label>

            <div className="two">
              <label>
                Village / Town *
                <input required placeholder="e.g. Devgad, Malvan" value={f.village} onChange={set('village')} />
              </label>

              <label>
                District *
                <select value={f.district} onChange={set('district')}>
                  <option value="Sindhudurg">Sindhudurg</option>
                  <option value="Ratnagiri">Ratnagiri</option>
                  <option value="Raigad">Raigad</option>
                  <option value="Goa">Goa</option>
                </select>
              </label>
            </div>

            <label>
              Your Producer Narrative / Story
              <textarea
                rows="3"
                placeholder="Share your family heritage, mango ripening techniques, stone-pounding methods, or harvesting practices…"
                value={f.story}
                onChange={set('story')}
              />
            </label>
            <p className="muted" style={{ fontSize: '0.8rem', margin: 0 }}>
              An administrator reviews new producer registrations before listings go live.
            </p>
          </div>
        )}

        {err && <div className="err" role="alert">{err}</div>}

        <button disabled={busy} style={{ width: '100%', padding: '0.8em', marginTop: '0.5rem' }}>
          {busy ? 'Verifying…' : isReg ? 'Create Account' : 'Log in'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '0.8rem', fontSize: '0.9rem' }}>
          {isReg ? (
            <span className="muted">
              Already registered? <Link to="/login" style={{ fontWeight: 600 }}>Log in here</Link>
            </span>
          ) : (
            <span className="muted">
              New to CoastRoots? <Link to="/register" style={{ fontWeight: 600 }}>Create an account</Link>
            </span>
          )}
        </div>

        {/* Demo Accounts Helper */}
        {!isReg && (
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: '1rem', marginTop: '0.5rem', textAlign: 'center' }}>
            <p className="muted" style={{ fontSize: '0.78rem', marginBottom: '0.4rem', fontWeight: 600 }}>
              Quick Demo Logins (Password: password123)
            </p>
            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="ghost"
                style={{ fontSize: '0.78rem', padding: '0.25em 0.6em' }}
                onClick={() => fillDemo('buyer@coastroots.in')}
              >
                Buyer
              </button>
              <button
                type="button"
                className="ghost"
                style={{ fontSize: '0.78rem', padding: '0.25em 0.6em' }}
                onClick={() => fillDemo('devgad@coastroots.in')}
              >
                Seller (Devgad)
              </button>
              <button
                type="button"
                className="ghost"
                style={{ fontSize: '0.78rem', padding: '0.25em 0.6em' }}
                onClick={() => fillDemo('admin@coastroots.in')}
              >
                Admin
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
