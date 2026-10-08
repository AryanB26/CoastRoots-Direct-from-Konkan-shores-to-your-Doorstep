import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from './api.js';

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

const T = {
  home: 'Home',
  shop: 'Shop',
  cart: 'Cart',
  orders: 'My orders',
  wishlist: 'Wishlist',
  login: 'Log in',
  logout: 'Log out',
  sell: 'Sell with us',
  tagline: 'Direct from Konkan shores to your doorstep',
  search: 'Search kokum, masala, mangoes…',
  add: 'Add to cart',
  inSeason: 'In season',
  offSeason: 'Out of season',
  perishable: 'Express Perishable',
  clearFilters: 'Clear all',
  category: 'Category',
  district: 'District',
  sortBy: 'Sort by',
  all: 'All',
  checkout: 'Checkout',
  subtotal: 'Subtotal',
  shipping: 'Shipping',
  freeShippingNotice: 'Free shipping on orders above ₹999',
  freeShippingUnlocked: 'You have unlocked Free Shipping!',
  placeOrder: 'Place order',
  cancelOrder: 'Cancel order',
};

export function Provider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cr_cart') || '[]'));
  const [toast, setToast] = useState('');
  const [wishlistOpen, setWishlistOpen] = useState(false);

  const say = useCallback((m) => {
    setToast(m);
    setTimeout(() => setToast(''), 2500);
  }, []);

  useEffect(() => { localStorage.setItem('cr_cart', JSON.stringify(cart)); }, [cart]);

  useEffect(() => {
    if (!localStorage.getItem('cr_token')) return setReady(true);
    api('/auth/me')
      .then(setUser)
      .catch(() => localStorage.removeItem('cr_token'))
      .finally(() => setReady(true));
  }, []);

  const login = (data) => {
    localStorage.setItem('cr_token', data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('cr_token');
    setUser(null);
  };

  const addToCart = (p, qty = 1) => {
    setCart((c) => {
      const ex = c.find((i) => i._id === p._id);
      if (ex) return c.map((i) => (i._id === p._id ? { ...i, qty: Math.min(p.stock, i.qty + qty) } : i));
      return [...c, { _id: p._id, name: p.name, price: p.price, emoji: p.emoji, image: p.image, stock: p.stock, perishable: p.perishable, qty }];
    });
    say(`${p.name} added to cart`);
  };

  const setQty = (id, qty) => {
    setCart((c) => c.map((i) => (i._id === id ? { ...i, qty: Math.max(1, Math.min(i.stock, qty)) } : i)));
  };

  const remove = (id) => setCart((c) => c.filter((i) => i._id !== id));
  const clearCart = () => setCart([]);

  const toggleWish = async (id) => {
    if (!user) {
      say('Please log in to save to your wishlist');
      return;
    }
    try {
      const r = await api(`/auth/wishlist/${id}`, { method: 'POST' });
      const wasAdded = r.wishlist?.includes(id);
      setUser((u) => ({ ...u, wishlist: r.wishlist }));
      say(wasAdded ? 'Saved to wishlist' : 'Removed from wishlist');
    } catch (e) {
      say(e.message);
    }
  };

  const t = (k) => T[k] || k;

  return (
    <Ctx.Provider
      value={{
        user,
        ready,
        login,
        logout,
        cart,
        addToCart,
        setQty,
        remove,
        clearCart,
        t,
        toast,
        say,
        toggleWish,
        wishlistOpen,
        setWishlistOpen,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
