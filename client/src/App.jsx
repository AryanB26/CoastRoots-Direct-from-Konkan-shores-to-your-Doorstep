import { useState, useEffect } from 'react';
import { Routes, Route, Link, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from './store.jsx';
import Landing from './pages/Landing.jsx';
import Home from './pages/Home.jsx';
import Product from './pages/Product.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import Orders from './pages/Orders.jsx';
import Auth from './pages/Auth.jsx';
import Seller from './pages/Seller.jsx';
import Admin from './pages/Admin.jsx';
import WishlistModal from './components/WishlistModal.jsx';

function Guard({ roles, children }) {
  const { user, ready } = useStore();
  if (!ready) return <p className="pad">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user, logout, cart, t, toast, setWishlistOpen } = useStore();
  const nav = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const count = cart.reduce((n, i) => n + i.qty, 0);
  const wishCount = user?.wishlist?.length || 0;

  // Close mobile menu on route navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header className="top">
        <Link to="/" className="brand">
          <b>CoastRoots</b>
          <span>{t('tagline')}</span>
        </Link>

        <button
          className="nav-toggle-btn"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>

        <nav className={mobileOpen ? 'open' : ''}>
          <NavLink to="/" end>{t('home')}</NavLink>
          <NavLink to="/shop">{t('shop')}</NavLink>
          {user?.role === 'seller' && <NavLink to="/seller">Dashboard</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
          {user?.role === 'buyer' && <NavLink to="/orders">{t('orders')}</NavLink>}
          {!user && <NavLink to="/register?role=seller">{t('sell')}</NavLink>}

          {user && (
            <button
              className="ghost"
              onClick={() => setWishlistOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center' }}
            >
              {t('wishlist')} {wishCount > 0 && <em className="badge">{wishCount}</em>}
            </button>
          )}

          <NavLink to="/cart">
            {t('cart')}
            {count > 0 && <em className="badge">{count}</em>}
          </NavLink>

          {user ? (
            <button
              className="ghost"
              onClick={() => {
                logout();
                nav('/');
              }}
            >
              {t('logout')} ({user.name.split(' ')[0]})
            </button>
          ) : (
            <NavLink to="/login">{t('login')}</NavLink>
          )}
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/shop" element={<Home />} />
          <Route path="/products" element={<Navigate to="/shop" replace />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Guard><Checkout /></Guard>} />
          <Route path="/orders" element={<Guard><Orders /></Guard>} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/register" element={<Auth mode="register" />} />
          <Route path="/seller" element={<Guard roles={['seller']}><Seller /></Guard>} />
          <Route path="/admin" element={<Guard roles={['admin']}><Admin /></Guard>} />
          <Route path="*" element={<p className="pad">Page not found. <Link to="/shop">Back to the shop</Link></p>} />
        </Routes>
      </main>

      <WishlistModal />

      <footer className="foot">
        <p style={{ fontWeight: 600, margin: '0 0 0.4rem', color: 'var(--ink)' }}>CoastRoots</p>
        <p style={{ margin: 0 }}>Direct from coastal producers in Sindhudurg, Ratnagiri, Raigad and Goa.</p>
        <p style={{ fontSize: '0.8rem', opacity: 0.75, marginTop: '0.6rem' }}>Authentic Konkan Produce · Natural Straw Ripened Mangoes · Stone-Pounded Spices</p>
      </footer>

      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}
