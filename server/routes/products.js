import { Router } from 'express';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { protect, allow, approvedSeller } from '../middleware/auth.js';

const r = Router();

r.get('/', async (req, res, next) => {
  try {
    const { q, category, district, min, max, sort, inSeason, page = 1, limit = 12 } = req.query;
    const conditions = [{ approved: true }];
    if (q) {
      const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      conditions.push({
        $or: [
          { name: { $regex: escaped, $options: 'i' } },
          { description: { $regex: escaped, $options: 'i' } },
          { category: { $regex: escaped, $options: 'i' } },
          { district: { $regex: escaped, $options: 'i' } },
          { village: { $regex: escaped, $options: 'i' } },
        ]
      });
    }
    if (category) conditions.push({ category });
    if (district) conditions.push({ district });
    if (min || max) conditions.push({ price: { ...(min && { $gte: +min }), ...(max && { $lte: +max }) } });
    if (inSeason === 'true') {
      const m = new Date().getMonth() + 1;
      conditions.push({
        $or: [
          { seasonFrom: null },
          { seasonFrom: { $exists: false } },
          {
            $expr: {
              $cond: [
                { $lte: ['$seasonFrom', '$seasonTo'] },
                { $and: [{ $lte: ['$seasonFrom', m] }, { $gte: ['$seasonTo', m] }] },
                { $or: [{ $gte: [m, '$seasonFrom'] }, { $lte: [m, '$seasonTo'] }] }
              ]
            }
          }
        ]
      });
    }
    const f = conditions.length > 1 ? { $and: conditions } : conditions[0];
    const sorts = { priceAsc: { price: 1 }, priceDesc: { price: -1 }, rating: { ratingAvg: -1 }, newest: { createdAt: -1 } };
    const total = await Product.countDocuments(f);
    const items = await Product.find(f).populate('seller', 'seller.shopName seller.village').sort(sorts[sort] || { createdAt: -1 })
      .skip((+page - 1) * +limit).limit(+limit);
    res.json({ items, total, pages: Math.ceil(total / +limit) });
  } catch (e) { next(e); }
});

r.get('/meta', async (_, res, next) => {
  try {
    const [categories, districts] = await Promise.all([Product.distinct('category', { approved: true }), Product.distinct('district', { approved: true })]);
    res.json({ categories, districts });
  } catch (e) { next(e); }
});

r.get('/mine/list', protect, allow('seller'), async (req, res, next) => {
  try { res.json(await Product.find({ seller: req.user._id }).sort({ createdAt: -1 })); } catch (e) { next(e); }
});

r.get('/:id', async (req, res, next) => {
  try {
    const p = await Product.findById(req.params.id).populate('seller', 'seller name');
    if (!p) return res.status(404).json({ message: 'Product not found' });
    res.json(p);
  } catch (e) { next(e); }
});

// Co-purchase recommendations, falling back to the same category
r.get('/:id/recommendations', async (req, res, next) => {
  try {
    const id = req.params.id;
    const orders = await Order.find({ 'items.product': id }).select('items.product').limit(500);
    const counts = {};
    orders.forEach((o) => o.items.forEach((i) => { const k = i.product?.toString(); if (k && k !== id) counts[k] = (counts[k] || 0) + 1; }));
    const ids = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k]) => k);
    let recs = ids.length ? await Product.find({ _id: { $in: ids }, approved: true }) : [];
    if (recs.length < 4) {
      const base = await Product.findById(id);
      const more = await Product.find({ category: base?.category, approved: true, _id: { $nin: [id, ...recs.map((p) => p._id)] } }).sort({ ratingAvg: -1 }).limit(4 - recs.length);
      recs = [...recs, ...more];
    }
    res.json(recs);
  } catch (e) { next(e); }
});

const fields = (b) => ({ name: b.name, description: b.description, category: b.category, price: b.price, unit: b.unit, stock: b.stock, emoji: b.emoji, image: b.image,
  village: b.village, district: b.district, batchDate: b.batchDate || undefined, perishable: !!b.perishable, seasonFrom: b.seasonFrom || undefined, seasonTo: b.seasonTo || undefined });

r.post('/', protect, approvedSeller, async (req, res, next) => {
  try {
    const b = req.body;
    if (!b.name || !b.category || b.price == null) return res.status(400).json({ message: 'Name, category and price are required' });
    const p = await Product.create({ ...fields(b), seller: req.user._id, village: b.village || req.user.seller.village, district: b.district || req.user.seller.district });
    res.status(201).json(p);
  } catch (e) { next(e); }
});

r.put('/:id', protect, allow('seller', 'admin'), async (req, res, next) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Product not found' });
    if (req.user.role !== 'admin' && !p.seller.equals(req.user._id)) return res.status(403).json({ message: 'Not your product' });
    Object.assign(p, fields(req.body));
    await p.save();
    res.json(p);
  } catch (e) { next(e); }
});

r.delete('/:id', protect, allow('seller', 'admin'), async (req, res, next) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Product not found' });
    if (req.user.role !== 'admin' && !p.seller.equals(req.user._id)) return res.status(403).json({ message: 'Not your product' });
    await p.deleteOne();
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default r;
