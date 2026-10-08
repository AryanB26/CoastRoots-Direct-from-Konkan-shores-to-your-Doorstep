import { Router } from 'express';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { protect } from '../middleware/auth.js';

const r = Router();

// Small lexicon-based sentiment scorer (swap for a Python/ML service later)
const POS = ['good', 'great', 'fresh', 'tasty', 'delicious', 'authentic', 'excellent', 'love', 'amazing', 'perfect', 'best', 'sweet', 'aromatic', 'quality', 'recommend'];
const NEG = ['bad', 'stale', 'poor', 'late', 'damaged', 'broken', 'smell', 'rotten', 'worst', 'expensive', 'disappointed', 'spoiled', 'waste', 'dry', 'bitter'];
export const sentiment = (text = '') => {
  const words = text.toLowerCase().match(/[a-z]+/g) || [];
  const s = words.reduce((n, w) => n + (POS.includes(w) ? 1 : NEG.includes(w) ? -1 : 0), 0);
  return s > 0 ? 'positive' : s < 0 ? 'negative' : 'neutral';
};

r.get('/:productId', async (req, res, next) => {
  try { res.json(await Review.find({ product: req.params.productId }).sort({ createdAt: -1 })); } catch (e) { next(e); }
});

r.post('/:productId', protect, async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const bought = await Order.exists({ buyer: req.user._id, 'items.product': req.params.productId, status: 'delivered' });
    if (!bought) return res.status(403).json({ message: 'You can review a product after it has been delivered to you' });
    const review = await Review.findOneAndUpdate(
      { product: req.params.productId, user: req.user._id },
      { rating: +rating, comment, userName: req.user.name, sentiment: sentiment(comment) },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
    const all = await Review.find({ product: req.params.productId });
    await Product.findByIdAndUpdate(req.params.productId, {
      ratingAvg: +(all.reduce((a, b) => a + b.rating, 0) / all.length).toFixed(1), numReviews: all.length });
    res.status(201).json(review);
  } catch (e) { next(e); }
});

export default r;
