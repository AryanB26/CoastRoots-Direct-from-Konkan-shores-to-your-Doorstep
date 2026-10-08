import mongoose from 'mongoose';
const orderSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String, price: Number, qty: Number, emoji: String, image: String,
  }],
  address: { fullName: String, phone: String, line1: String, city: String, state: String, pincode: String },
  total: Number,
  status: { type: String, enum: ['placed', 'packed', 'shipped', 'delivered', 'cancelled'], default: 'placed' },
  payment: { method: { type: String, enum: ['cod', 'razorpay'], default: 'cod' }, paid: { type: Boolean, default: false }, razorpayOrderId: String, razorpayPaymentId: String },
}, { timestamps: true });
export default mongoose.model('Order', orderSchema);
