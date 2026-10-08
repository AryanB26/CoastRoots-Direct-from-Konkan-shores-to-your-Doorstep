import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store.jsx';
import { api } from '../api.js';

export default function Landing() {
  const { user, logout, login, say } = useStore();
  const navigate = useNavigate();

  // Quick 1-click login helper to easily test each role
  const handleQuickLogin = async (email, redirectPath) => {
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: { email, password: 'password123' },
      });
      login(data);
      say(`Logged in as ${data.user.name} (${data.user.role})`);
      navigate(redirectPath);
    } catch (err) {
      say(err.message || 'Login failed');
    }
  };

  return (
    <div className="landing-wrapper">
      <div className="landing-page">
        {/* 1. Hero Section */}
      <section className="landing-hero">
        <h1>Pure Konkan Produce, Direct From Soil & Sea</h1>
        <p className="landing-lead">
          Connecting smallholder farmers, fishermen, and women’s self-help groups from Sindhudurg, Ratnagiri, Raigad, and Goa directly with conscious buyers.
        </p>
      </section>

      {/* 2. Active Session Banner */}
      {user && (
        <section className="landing-user-banner">
          <div className="landing-user-info">
            <div>
              <strong>Welcome back, {user.name}</strong>
              <p>You are currently signed in as {user.role.toUpperCase()}.</p>
            </div>
          </div>
          <div className="landing-user-actions">
            {user.role === 'buyer' && (
              <>
                <Link to="/shop" className="landing-btn-primary">Browse Shop</Link>
                <Link to="/orders" className="landing-btn-ghost">My Orders</Link>
              </>
            )}
            {user.role === 'seller' && (
              <Link to="/seller" className="landing-btn-primary">Open Seller Dashboard</Link>
            )}
            {user.role === 'admin' && (
              <Link to="/admin" className="landing-btn-primary">Open Admin Panel</Link>
            )}
            <button type="button" onClick={logout} className="landing-btn-ghost">
              Log out
            </button>
          </div>
        </section>
      )}

      {/* 3. Role Selection Portal: Buyer, Seller, or Admin */}
      <section className="landing-roles-section">
        <div className="landing-section-header">
          <h2>Select Your Role to Continue</h2>
          <p>Choose the portal that matches how you want to use CoastRoots.</p>
        </div>

        <div className="roles-grid">
          {/* Option A: Buyer */}
          <div className="role-card role-buyer">
            <div className="role-header">
              <span className="role-tag tag-buyer">Buyer</span>
            </div>
            <img 
              src="/images/buyer_card.jpg" 
              alt="Local harvest" 
              className="role-image" 
            />
            <h3>Buy Fresh & Authentic</h3>
            <p>
              Browse naturally ripened Alphonso mangoes, stone-pounded Malvani spices, cashews, kokum, and dried seafood directly from certified local growers.
            </p>
            <ul className="role-features">
              <li>100% genuine coastal origin</li>
              <li>Fair prices, zero middlemen markup</li>
              <li>Climate-safe express courier</li>
            </ul>
            <div className="role-footer">
              <Link to="/shop" className="landing-btn-primary">
                Explore Products
              </Link>
              {!user && (
                <Link to="/login" className="landing-btn-link">
                  Buyer Sign In
                </Link>
              )}
            </div>
          </div>

          {/* Option B: Seller */}
          <div className="role-card role-seller">
            <div className="role-header">
              <span className="role-tag tag-seller">Seller</span>
            </div>
            <img 
              src="/images/seller_card.jpg" 
              alt="Coastal farmer" 
              className="role-image" 
            />
            <h3>Sell Your Konkan Produce</h3>
            <p>
              Are you an orchard owner, fishing collective, or women’s self-help group? Sell directly to pan-India buyers with transparent pricing.
            </p>
            <ul className="role-features">
              <li>Direct earnings with fair margins</li>
              <li>Simple dashboard to manage stock</li>
              <li>Quick verification & onboarding</li>
            </ul>
            <div className="role-footer">
              <Link to="/register?role=seller" className="landing-btn-primary">
                Register as Seller
              </Link>
              <Link to="/seller" className="landing-btn-link">
                Seller Dashboard
              </Link>
            </div>
          </div>

          {/* Option C: Admin */}
          <div className="role-card role-admin">
            <div className="role-header">
              <span className="role-tag tag-admin">Admin</span>
            </div>
            <img 
              src="/images/admin_card.jpg" 
              alt="Admin dashboard" 
              className="role-image" 
            />
            <h3>Platform Administration</h3>
            <p>
              Review and approve new producer applications, monitor product listings, audit customer sentiment, and oversee fulfillment operations.
            </p>
            <ul className="role-features">
              <li>Seller KYC & shop approvals</li>
              <li>Product & inventory moderation</li>
              <li>Sentiment tags & dispute tracking</li>
            </ul>
            <div className="role-footer">
              <Link to="/admin" className="landing-btn-primary">
                Open Admin Panel
              </Link>
              {!user && (
                <Link to="/login" className="landing-btn-link">
                  Admin Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Interactive 1-Click Demo Testing */}
      <section className="landing-demo-section">
        <div className="demo-box">
          <div className="demo-title">
            <h4>Quick Demo Access (1-Click Test)</h4>
            <p>Click any role below to instantly log in with pre-seeded demo credentials:</p>
          </div>
          <div className="demo-actions">
            <button
              type="button"
              className="demo-pill demo-pill-buyer"
              onClick={() => handleQuickLogin('buyer@coastroots.in', '/shop')}
            >
              Test as Buyer
            </button>
            <button
              type="button"
              className="demo-pill demo-pill-seller"
              onClick={() => handleQuickLogin('devgad@coastroots.in', '/seller')}
            >
              Test as Seller
            </button>
            <button
              type="button"
              className="demo-pill demo-pill-admin"
              onClick={() => handleQuickLogin('admin@coastroots.in', '/admin')}
            >
              Test as Admin
            </button>
          </div>
        </div>
      </section>

      {/* 5. How It Works: Pillars */}
      <section className="landing-pillars">
        <div className="pillar-item">
          <img src="/images/pillar_origin.jpg" alt="Authentic Origin" className="pillar-img" />
          <h4>Authentic Konkan Origin</h4>
          <p>
            Ripened naturally in paddy straw and stone-ground by coastal self-help groups.
          </p>
        </div>
        <div className="pillar-item">
          <img src="/images/pillar_fairtrade.jpg" alt="Fair Trade" className="pillar-img" />
          <h4>Fair Trade & Direct Payouts</h4>
          <p>
            Over 85% of order value goes directly to the producers with no middleman cuts.
          </p>
        </div>
        <div className="pillar-item">
          <img src="/images/pillar_dispatch.jpg" alt="Safe Dispatch" className="pillar-img" />
          <h4>Climate-Safe Dispatch</h4>
          <p>
            Breathable packaging and regional perishable routes preserving harvest freshness.
          </p>
        </div>
      </section>
      </div>
    </div>
  );
}
