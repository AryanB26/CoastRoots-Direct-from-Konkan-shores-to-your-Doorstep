import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const r = Router();
const sign = (u) => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const pub = (u) => ({ _id: u._id, name: u.name, email: u.email, role: u.role, seller: u.seller, wishlist: u.wishlist });

r.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role, shopName, village, district, story } = req.body;
    if (!name || !email || !password || password.length < 6) return res.status(400).json({ message: 'Name, email and a password of 6+ characters are required' });
    if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: 'This email is already registered' });
    const isSeller = role === 'seller';
    const user = await User.create({
      name, email, password: await bcrypt.hash(password, 10), role: isSeller ? 'seller' : 'buyer',
      ...(isSeller && { seller: { shopName, village, district, story, approved: false } }),
    });
    res.status(201).json({ token: sign(user), user: pub(user) });
  } catch (e) { next(e); }
});

r.post('/login', async (req, res, next) => {
  try {
    const user = await User.findOne({ email: (req.body.email || '').toLowerCase() });
    if (!user || !(await bcrypt.compare(req.body.password || '', user.password)))
      return res.status(401).json({ message: 'Email or password is incorrect' });
    res.json({ token: sign(user), user: pub(user) });
  } catch (e) { next(e); }
});

r.get('/me', protect, (req, res) => res.json(pub(req.user)));

r.get('/wishlist', protect, async (req, res, next) => {
  try {
    const u = await User.findById(req.user._id).populate({
      path: 'wishlist',
      match: { approved: true },
      populate: { path: 'seller', select: 'seller.shopName seller.village' }
    });
    res.json(u?.wishlist || []);
  } catch (e) { next(e); }
});

r.post('/wishlist/:id', protect, async (req, res, next) => {
  try {
    const u = req.user; const id = req.params.id;
    const has = u.wishlist.some((p) => p.toString() === id);
    u.wishlist = has ? u.wishlist.filter((p) => p.toString() !== id) : [...u.wishlist, id];
    await u.save();
    res.json({ wishlist: u.wishlist });
  } catch (e) { next(e); }
});

export default r;
