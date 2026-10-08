import { Router } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { protect, allow } from '../middleware/auth.js';

const r = Router();
const rzp = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET }) : null;

const FREE_SHIP_ABOVE = 999;
export const shippingFor = (subtotal, hasPerishable) => (subtotal >= FREE_SHIP_ABOVE ? 0 : 60) + (hasPerishable ? 80 : 0);

// Pincode check: Maharashtra/Goa/Karnataka coastal range (6xxxxx) is the demo-serviceable zone
r.get('/pincode/:pin', (req, res) => {
  const pin = req.params.pin;
  if (!/^[1-9][0-9]{5}$/.test(pin)) return res.status(400).json({ message: 'Enter a valid 6-digit pincode' });
  const zone = /^(4[0-4]|40|41|42|403)/.test(pin) ? 'express' : 'standard';
  res.json({ serviceable: true, days: zone === 'express' ? 2 : 5, perishableOk: zone === 'express' });
});

r.post('/', protect, async (req, res, next) => {
  try {
    const { items, address, method = 'cod' } = req.body;
    if (!items?.length) return res.status(400).json({ message: 'Your cart is empty' });
    if (!address?.fullName || !address?.phone || !address?.line1 || !/^[1-9][0-9]{5}$/.test(address?.pincode || ''))
      return res.status(400).json({ message: 'Complete the delivery address with a valid pincode' });

    const lines = []; let subtotal = 0; let perishable = false;
    for (const it of items) {
      const p = await Product.findById(it.product);
      if (!p || !p.approved) return res.status(400).json({ message: 'An item in your cart is no longer available' });
      const qty = Math.max(1, parseInt(it.qty, 10) || 1);
      if (p.stock < qty) return res.status(400).json({ message: `Only ${p.stock} of ${p.name} left` });
      subtotal += p.price * qty; perishable ||= p.perishable;
      lines.push({ p, qty });
    }
    const total = subtotal + shippingFor(subtotal, perishable);

    if (perishable) {
      const isExpressZone = /^(4[0-4]|40|41|42|403)/.test(address.pincode);
      if (!isExpressZone) {
        return res.status(400).json({
          message: `Fresh perishable items require 2-day express delivery, which is currently limited to Maharashtra/Goa express pincodes (starts with 40-44). Pincode ${address.pincode} is not eligible.`
        });
      }
    }

    // Decrement stock atomically; roll back if any line fails
    const done = [];
    for (const { p, qty } of lines) {
      const upd = await Product.updateOne({ _id: p._id, stock: { $gte: qty } }, { $inc: { stock: -qty } });
      if (!upd.modifiedCount) {
        for (const d of done) await Product.updateOne({ _id: d.p._id }, { $inc: { stock: d.qty } });
        return res.status(400).json({ message: `${p.name} just sold out` });
      }
      done.push({ p, qty });
    }

    const order = await Order.create({
      buyer: req.user._id, address, total,
      items: lines.map(({ p, qty }) => ({ product: p._id, seller: p.seller, name: p.name, price: p.price, qty, emoji: p.emoji, image: p.image })),
      payment: { method: method === 'razorpay' && rzp ? 'razorpay' : 'cod' },
    });

    let razorpay = null;
    if (order.payment.method === 'razorpay') {
      const ro = await rzp.orders.create({ amount: Math.round(total * 100), currency: 'INR', receipt: order._id.toString() });
      order.payment.razorpayOrderId = ro.id; await order.save();
      razorpay = { orderId: ro.id, amount: ro.amount, keyId: process.env.RAZORPAY_KEY_ID };
    }
    res.status(201).json({ order, razorpay });
  } catch (e) { next(e); }
});

r.post('/:id/verify', protect, async (req, res, next) => {
  try {
    const { razorpay_payment_id, razorpay_signature } = req.body;
    const order = await Order.findOne({ _id: req.params.id, buyer: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${order.payment.razorpayOrderId}|${razorpay_payment_id}`).digest('hex');
    if (expected !== razorpay_signature) return res.status(400).json({ message: 'Payment verification failed' });
    order.payment.paid = true; order.payment.razorpayPaymentId = razorpay_payment_id; await order.save();
    res.json(order);
  } catch (e) { next(e); }
});

r.get('/mine', protect, async (req, res, next) => {
  try { res.json(await Order.find({ buyer: req.user._id }).sort({ createdAt: -1 })); } catch (e) { next(e); }
});

r.get('/seller', protect, allow('seller'), async (req, res, next) => {
  try {
    const orders = await Order.find({ 'items.seller': req.user._id }).populate('buyer', 'name email').sort({ createdAt: -1 });
    res.json(orders.map((o) => ({ ...o.toObject(), items: o.items.filter((i) => i.seller?.equals(req.user._id)) })));
  } catch (e) { next(e); }
});

r.patch('/:id/status', protect, allow('seller', 'admin'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (req.user.role === 'seller' && !order.items.some((i) => i.seller?.equals(req.user._id))) return res.status(403).json({ message: 'Not your order' });
    order.status = status;
    if (status === 'delivered' && order.payment.method === 'cod') order.payment.paid = true;
    await order.save();
    res.json(order);
  } catch (e) { next(e); }
});

r.patch('/:id/cancel', protect, async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, buyer: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'placed') return res.status(400).json({ message: 'This order can no longer be cancelled' });
    order.status = 'cancelled'; await order.save();
    for (const i of order.items) await Product.updateOne({ _id: i.product }, { $inc: { stock: i.qty } });
    res.json(order);
  } catch (e) { next(e); }
});

// Seller analytics: monthly revenue, top products, seasonal demand
r.get('/seller/analytics', protect, allow('seller'), async (req, res, next) => {
  try {
    const orders = await Order.find({ 'items.seller': req.user._id, status: { $ne: 'cancelled' } });
    const monthly = {}; const top = {}; let revenue = 0;
    orders.forEach((o) => o.items.filter((i) => i.seller?.equals(req.user._id)).forEach((i) => {
      const key = o.createdAt.toISOString().slice(0, 7);
      monthly[key] = (monthly[key] || 0) + i.price * i.qty;
      top[i.name] = (top[i.name] || 0) + i.qty; revenue += i.price * i.qty;
    }));
    const series = Object.entries(monthly).sort().map(([month, revenue]) => ({ month, revenue }));
    // Naive forecast: average of last 3 months with linear trend
    const last = series.slice(-3).map((s) => s.revenue);
    const avg = last.length ? last.reduce((a, b) => a + b, 0) / last.length : 0;
    const trend = last.length > 1 ? (last[last.length - 1] - last[0]) / (last.length - 1) : 0;
    res.json({ revenue, orders: orders.length, series,
      topProducts: Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, units]) => ({ name, units })),
      forecastNextMonth: Math.max(0, Math.round(avg + trend)) });
  } catch (e) { next(e); }
});

export default r;
