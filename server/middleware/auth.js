import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Please log in' });
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'Account not found' });
    next();
  } catch { res.status(401).json({ message: 'Session expired, log in again' }); }
};

export const allow = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'Not allowed' });

export const approvedSeller = (req, res, next) =>
  req.user.role === 'seller' && req.user.seller?.approved
    ? next()
    : res.status(403).json({ message: 'Your seller account is awaiting admin approval' });
