import { Router } from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { protect, allow } from '../middleware/auth.js';

const r = Router();
r.use(protect, allow('admin'));

r.get('/stats', async (_, res, next) => {
  try {
    const [users, sellers, products, orders, revenue] = await Promise.all([
      User.countDocuments({ role: 'buyer' }), User.countDocuments({ role: 'seller' }), Product.countDocuments(), Order.countDocuments(),
      Order.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    ]);
    res.json({ users, sellers, products, orders, revenue: revenue[0]?.total || 0 });
  } catch (e) { next(e); }
});

r.get('/sellers', async (_, res, next) => {
  try { res.json(await User.find({ role: 'seller' }).select('-password').sort({ createdAt: -1 })); } catch (e) { next(e); }
});
r.patch('/sellers/:id', async (req, res, next) => {
  try {
    const u = await User.findOneAndUpdate({ _id: req.params.id, role: 'seller' }, { 'seller.approved': !!req.body.approved }, { new: true }).select('-password');
    res.json(u);
  } catch (e) { next(e); }
});

r.get('/products', async (_, res, next) => {
  try { res.json(await Product.find().populate('seller', 'seller.shopName').sort({ approved: 1, createdAt: -1 })); } catch (e) { next(e); }
});
r.patch('/products/:id', async (req, res, next) => {
  try { res.json(await Product.findByIdAndUpdate(req.params.id, { approved: !!req.body.approved }, { new: true })); } catch (e) { next(e); }
});

r.get('/orders', async (_, res, next) => {
  try { res.json(await Order.find().populate('buyer', 'name email').sort({ createdAt: -1 }).limit(100)); } catch (e) { next(e); }
});

export default r;
